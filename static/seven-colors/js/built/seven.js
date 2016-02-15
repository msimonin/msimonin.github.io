/// <reference path="./underscore.d.ts" />
/// <reference path="./d3.d.ts"/>
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Cell = (function () {
    function Cell(x, y, value) {
        this.x = x;
        this.y = y;
        this.owner = "";
        this.value = value;
        this.connex = [this];
    }
    return Cell;
})();
var BasicAI = (function () {
    function BasicAI(game, zone, color) {
        this.game = game;
        this.zone = zone;
        this.color = color;
        this.i = 0;
        //make the first step
        for (var i in zone) {
            var cell = zone[i];
            cell.owner = this.color;
            // remove cell from its connex part
            // as it is removed from the game
            // do it in place
            var index = _.findIndex(cell.connex, function (d) { return d.x === cell.x && d.y === cell.y; });
            cell.connex.splice(index, 1);
        }
    }
    // the AI plays
    BasicAI.prototype.oneStep = function () {
        // old the closest possible neighbours of the controlled zone
        var candidates = this.getCandidates();
        var keys = Object.keys(candidates);
        if (keys.length == 0) {
            return false;
        }
        // pick one group (the first one)
        var choices = candidates[keys[0]];
        for (var c in choices) {
            var choice = choices[c];
            choice.owner = this.color;
            //choice.value = -1;
            // extend the zone;
            this.zone.push(choice);
        }
        return true;
    };
    /*
    *
    */
    BasicAI.prototype.getCandidates = function () {
        var candidates = {};
        for (var i in this.zone) {
            var cell = this.zone[i];
            var frees = game.freeNeighbours(cell);
            for (var f in frees) {
                var free = frees[f];
                candidates[free.value] = candidates[free.value] || [];
                // add it if not already here
                for (var c in free.connex) {
                    var conn = free.connex[c];
                    if (!candidates[free.value].some(function (d) { return d.x === conn.x && d.y === conn.y; })) {
                        candidates[free.value].push(conn);
                        if (conn.x === 0 && conn.y === 0) {
                            console.log("pushinh origin");
                        }
                    }
                }
            }
        }
        return candidates;
    };
    return BasicAI;
})();
var GreedyAI = (function (_super) {
    __extends(GreedyAI, _super);
    function GreedyAI(game, zone, color) {
        _super.call(this, game, zone, color);
    }
    // the AI plays
    GreedyAI.prototype.oneStep = function () {
        // old the closest possible neighbours of the controlled zone
        var candidates = this.getCandidates();
        var keys = Object.keys(candidates);
        if (keys.length == 0) {
            return false;
        }
        var values = keys
            .map(function (k, i) { return candidates[k]; });
        // we pick the groups which have the most cells
        var choices = _.max(values, function (v) { return v.length; });
        for (var c in choices) {
            var choice = choices[c];
            choice.owner = this.color;
            //choice.value = -1;
            // extend the zone;
            this.zone.push(choice);
        }
        return true;
    };
    return GreedyAI;
})(BasicAI);
var Game = (function () {
    function Game(dimension, colors) {
        this.dimension = dimension;
        this.colors = colors;
        this.world = [];
        this.size = 500;
        for (var i = 0; i < dimension; i++) {
            for (var j = 0; j < dimension; j++) {
                var value = Math.floor(this.colors * Math.random());
                var cell = new Cell(j, i, value);
                this.world.push(cell);
                // append this cell to the connex part of it neighbours
                // or create a new connex part
                // at this time this.neighbours(cell) returns the two cells on top and on left
                // of the current cell
                var neighbours = this.neighbours(cell);
                var first = neighbours[0];
                if (neighbours.length > 0 && cell.value === first.value) {
                    // we connect to the connex of the first
                    first.connex.push(cell);
                    cell.connex = first.connex;
                }
                if (neighbours.length == 2) {
                    var second = neighbours[1];
                    if (first.value == cell.value && cell.value == second.value) {
                        var merge = (first.connex).concat(second.connex);
                        // we update all the refs
                        for (var f in first.connex) {
                            var c = first.connex[f];
                            c.connex = merge;
                        }
                        for (var s in second.connex) {
                            var c = second.connex[s];
                            c.connex = merge;
                        }
                        // finally e update the connex of the current cell
                        cell.connex = merge;
                    }
                    else if (cell.value == second.value) {
                        // we connect to the connex of second
                        second.connex.push(cell);
                        cell.connex = second.connex;
                    }
                }
            }
        }
    }
    // define the neighbourhood
    Game.prototype.neighbours = function (cell) {
        var x = cell.x;
        var y = cell.y;
        var index = cell.x + this.dimension * y;
        // there is one on the left
        var n = [];
        if (x > 0 && typeof (this.world[index - 1]) != "undefined") {
            n.push(this.world[index - 1]);
        }
        // there is one on the right
        if (x < this.dimension - 1 && typeof (this.world[index + 1]) != "undefined") {
            n.push(this.world[index + 1]);
        }
        if (y > 0 && typeof (this.world[index - this.dimension]) != "undefined") {
            n.push(this.world[index - this.dimension]);
        }
        if (y < this.dimension - 1 && typeof (this.world[index + this.dimension]) != "undefined") {
            n.push(this.world[index + this.dimension]);
        }
        return n;
    };
    Game.prototype.freeNeighbours = function (cell) {
        return this.neighbours(cell).filter(function (n) { return n.owner === ""; });
    };
    return Game;
})();
var Drawer = (function () {
    function Drawer(game, speed) {
        this.game = game;
        this.speed = speed;
        var svg = d3.select("#graph")
            .append("svg")
            .attr("width", game.size)
            .attr("height", game.size);
        var scale = d3.scale.linear()
            .domain([0, game.dimension])
            .range([0, game.size]);
        this.svgDatas = svg.selectAll("rect").data(game.world, function (d) { return d.x + "-" + d.y; });
        this.svgDatas.enter()
            .append("rect")
            .attr("x", function (d) { return scale(d.x); })
            .attr("y", function (d) { return scale(d.y); })
            .attr("width", game.size / game.dimension)
            .attr("height", game.size / game.dimension);
        this.update();
    }
    // update the graph
    Drawer.prototype.update = function () {
        this.svgDatas
            .style("fill", function (d) {
            if (d.owner != "") {
                return d.owner;
            }
            return color(d.value);
        })
            .style("opacity", function (d) {
            if (d.owner != "") {
                return 1;
            }
            return 0.6;
        });
    };
    return Drawer;
})();
// global colors mapping ...
var color = d3.scale.category10();
var SPEED = 1000;
var SIZE = 10;
var game = new Game(SIZE, 4);
var ai1 = new GreedyAI(game, [game.world[0]], "red");
var ai2 = new BasicAI(game, [game.world[SIZE * SIZE - 1]], "blue");
var drawer = new Drawer(game, SPEED);
drawer.update();
step();
function step() {
    var one1 = ai1.oneStep();
    var one2 = ai2.oneStep();
    drawer.update();
    if (one1 || one2) {
        setTimeout(step, SPEED);
    }
}
