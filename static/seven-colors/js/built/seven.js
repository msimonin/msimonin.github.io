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
        var randomIndex = Math.floor(Math.random() * keys.length);
        var groups = candidates[keys[randomIndex]];
        for (var g in groups) {
            var group = groups[g];
            for (var c in groups[g]) {
                var choice = group[c];
                choice.owner = this.color;
                //choice.value = -1;
                // extend the zone;
                this.zone.push(choice);
            }
        }
        return true;
    };
    BasicAI.prototype.extend = function (d) {
        var found = false;
        var candidates = this.getCandidates();
        for (var k in candidates) {
            var groups = candidates[k];
            // check if d is in one group
            found = groups.some(function (group) {
                return group.some(function (cell) {
                    return cell.x === d.x && cell.y === d.y;
                });
            });
            if (found) {
                // we can extend with value k
                for (var g in groups) {
                    var group = groups[g];
                    for (var c in group) {
                        var choice = group[c];
                        choice.owner = this.color;
                        this.zone.push(choice);
                    }
                }
                break;
            }
        }
        return found;
    };
    /*
    *
    */
    BasicAI.prototype.getCandidates = function () {
        var candidates = {};
        for (var i in this.zone) {
            var cell = this.zone[i];
            var frees = this.game.freeNeighbours(cell);
            for (var f in frees) {
                var free = frees[f];
                candidates[free.value] = candidates[free.value] || [];
                // we add free.connex if it isn't already in
                // as we are dealing with connex part we only check for the first element.
                var first = free.connex[0];
                var alreadyAdded = candidates[free.value].some(function (c) {
                    return c.some(function (cc) {
                        return cc.x === first.x && cc.y === first.y;
                    });
                });
                if (!alreadyAdded) {
                    candidates[free.value].push(free.connex);
                }
            }
        }
        return candidates;
    };
    return BasicAI;
})();
var HumanAI = (function (_super) {
    __extends(HumanAI, _super);
    function HumanAI() {
        _super.apply(this, arguments);
    }
    HumanAI.prototype.oneStep = function () {
        return false;
    };
    return HumanAI;
})(BasicAI);
var GreedyMaxGroupAI = (function (_super) {
    __extends(GreedyMaxGroupAI, _super);
    function GreedyMaxGroupAI(game, zone, color) {
        _super.call(this, game, zone, color);
    }
    // the AI plays
    GreedyMaxGroupAI.prototype.oneStep = function () {
        // old the closest possible neighbours of the controlled zone
        var candidates = this.getCandidates();
        var keys = Object.keys(candidates);
        if (keys.length == 0) {
            return false;
        }
        var values = keys
            .map(function (k, i) { return candidates[k]; });
        // we pick the groups which have the most connex part
        var groups = _.max(values, function (v) { return v.length; });
        for (var g in groups) {
            var group = groups[g];
            for (var c in group) {
                var choice = group[c];
                choice.owner = this.color;
                this.zone.push(choice);
            }
        }
        return true;
    };
    return GreedyMaxGroupAI;
})(BasicAI);
var GreedyMaxCellsAI = (function (_super) {
    __extends(GreedyMaxCellsAI, _super);
    function GreedyMaxCellsAI(game, zone, color) {
        _super.call(this, game, zone, color);
    }
    // the AI plays
    GreedyMaxCellsAI.prototype.oneStep = function () {
        // old the closest possible neighbours of the controlled zone
        var candidates = this.getCandidates();
        var keys = Object.keys(candidates);
        if (keys.length == 0) {
            return false;
        }
        var values = keys
            .map(function (k, i) { return candidates[k]; });
        // we pick the groups which have the most connex part
        var groups = values.map(function (g) {
            return g.reduce(function (p, c) {
                for (var cc in c) {
                    p.push(c[cc]);
                }
                return p;
            }, []);
        });
        var group = _.max(groups, function (d) { return d.length; });
        for (var g in group) {
            var choice = group[g];
            choice.owner = this.color;
            this.zone.push(choice);
        }
        return true;
    };
    return GreedyMaxCellsAI;
})(BasicAI);
var Game = (function () {
    function Game(dimension, colors) {
        this.dimension = dimension;
        this.colors = colors;
        this.world = [];
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
    function Drawer(game, speed, selection, size) {
        this.game = game;
        this.speed = speed;
        this.size = size;
        var div = d3.select(selection);
        div.select("svg").remove();
        var svg = div.append("svg")
            .attr("width", this.size)
            .attr("height", this.size);
        var scale = d3.scale.linear()
            .domain([0, game.dimension])
            .range([0, this.size]);
        this.svgDatas = svg.selectAll("rect").data(game.world, function (d) { return d.x + "-" + d.y; });
        this.svgDatas.enter()
            .append("rect")
            .attr("x", function (d) { return scale(d.x); })
            .attr("y", function (d) { return scale(d.y); })
            .attr("width", this.size / game.dimension)
            .attr("height", this.size / game.dimension);
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
function draw_match() {
    var DIMENSION = 50;
    var SPEED = 100;
    var SIZE = 500;
    var COLORS = 7;
    var ruleGame = new Game(DIMENSION, COLORS);
    var ai1 = new BasicAI(ruleGame, [ruleGame.world[0]], "red");
    var ai2 = new GreedyMaxCellsAI(ruleGame, [ruleGame.world[DIMENSION * DIMENSION - 1]], "blue");
    var drawer = new Drawer(ruleGame, SPEED, "#match", SIZE);
    iterate();
    function iterate() {
        var one1 = ai1.oneStep();
        var one2 = ai2.oneStep();
        drawer.update();
        if (one1 || one2) {
            setTimeout(iterate, SPEED);
        }
    }
}
var ExampleGame = (function () {
    function ExampleGame(ai, selection, colors, dimension, size, speed) {
        if (colors === void 0) { colors = 4; }
        if (dimension === void 0) { dimension = 4; }
        if (size === void 0) { size = 150; }
        if (speed === void 0) { speed = 100; }
        this.colors = colors;
        this.dimension = dimension;
        this.size = size;
        this.speed = speed;
        this.selection = selection;
        this.aistring = ai;
    }
    ExampleGame.prototype.start = function () {
        this.game = new Game(this.dimension, this.colors);
        this.buildAI();
        this.drawer = new Drawer(this.game, this.speed, this.selection, this.size);
    };
    ExampleGame.prototype.oneStep = function () {
        var one = this.ai.oneStep();
        this.drawer.update();
        return one;
    };
    ExampleGame.prototype.buildAI = function () {
        if (this.aistring == "basic") {
            this.ai = new BasicAI(this.game, [this.game.world[0]], "red");
        }
        else if (this.aistring == "greedyMaxCells") {
            this.ai = new GreedyMaxCellsAI(this.game, [this.game.world[0]], "red");
        }
        else if (this.aistring == "greedyMaxGroups") {
            this.ai = new GreedyMaxGroupAI(this.game, [this.game.world[0]], "red");
        }
    };
    return ExampleGame;
})();
var VersusGame = (function () {
    function VersusGame(ai1, ai2, selection, colors, dimension, size, speed) {
        if (colors === void 0) { colors = 4; }
        if (dimension === void 0) { dimension = 4; }
        if (size === void 0) { size = 150; }
        if (speed === void 0) { speed = 100; }
        this.colors = colors;
        this.dimension = dimension;
        this.size = size;
        this.speed = speed;
        this.selection = selection;
        this.ai1string = ai1;
        this.ai2string = ai2;
    }
    VersusGame.prototype.start = function () {
        this.game = new Game(this.dimension, this.colors);
        this.ai1 = this.buildAI(this.ai1string, 0, "red");
        this.ai2 = this.buildAI(this.ai2string, this.dimension * this.dimension - 1, "blue");
        this.drawer = new Drawer(this.game, this.speed, this.selection, this.size);
        this.drawer.update();
    };
    VersusGame.prototype.buildAI = function (aistring, start, color) {
        if (aistring == "basic") {
            return new BasicAI(this.game, [this.game.world[start]], color);
        }
        else if (aistring == "greedyMaxCells") {
            return new GreedyMaxCellsAI(this.game, [this.game.world[start]], color);
        }
        else if (aistring == "greedyMaxGroups") {
            return new GreedyMaxGroupAI(this.game, [this.game.world[start]], color);
        }
    };
    VersusGame.prototype.oneStep = function () {
        var one = this.ai1.oneStep();
        var two = this.ai2.oneStep();
        this.drawer.update();
        return one || two;
    };
    VersusGame.prototype.launch = function () {
        var _this = this;
        if (this.oneStep()) {
            setTimeout(function () { _this.launch(); }, this.speed);
        }
    };
    return VersusGame;
})();
var HumanGame = (function () {
    function HumanGame(ai1, selection, statsSelection, colors, dimension, size) {
        if (colors === void 0) { colors = 7; }
        if (dimension === void 0) { dimension = 20; }
        if (size === void 0) { size = 500; }
        this.colors = colors;
        this.dimension = dimension;
        this.size = size;
        this.selection = selection;
        this.ai1string = ai1;
        this.speed = 100;
        this.statsSelection = statsSelection;
    }
    HumanGame.prototype.start = function () {
        var _this = this;
        this.displayStats = d3.select(this.statsSelection);
        this.game = new Game(this.dimension, this.colors);
        this.ai1 = this.buildAI(this.ai1string, this.dimension * this.dimension - 1, "blue");
        this.human = this.buildAI("human", 0, "red");
        this.game.world[0].owner = "red";
        this.drawer = new Drawer(this.game, this.speed, this.selection, this.size);
        this.drawer.update();
        this.drawer.svgDatas.on("click", function (d) {
            // check if d is in the candidates
            if (_this.human.extend(d)) {
                // ai step
                _this.ai1.oneStep();
                _this.drawer.update();
                var stats = _this.stats();
                var color = "red";
                if (stats.human >= stats.ai) {
                    color = "red";
                }
                else {
                    color = "blue";
                }
                _this.displayStats.style("background-color", color);
            }
            ;
        });
    };
    HumanGame.prototype.buildAI = function (aistring, start, color) {
        if (aistring == "basic") {
            return new BasicAI(this.game, [this.game.world[start]], color);
        }
        else if (aistring == "greedyMaxCells") {
            return new GreedyMaxCellsAI(this.game, [this.game.world[start]], color);
        }
        else if (aistring == "greedyMaxGroups") {
            return new GreedyMaxGroupAI(this.game, [this.game.world[start]], color);
        }
        else if (aistring == "human") {
            return new HumanAI(this.game, [this.game.world[start]], color);
        }
    };
    HumanGame.prototype.stats = function () {
        return {
            human: this.human.zone.length,
            ai: this.ai1.zone.length
        };
    };
    return HumanGame;
})();
var ruleGame = new ExampleGame("basic", "#rules");
var stratRandomGame = new ExampleGame("basic", "#strat-random");
var stratGreedyMaxCellsGame = new ExampleGame("greedyMaxCells", "#strat-greedy-max-cells");
var stratGreedyMaxGroupsGame = new ExampleGame("greedyMaxGroups", "#strat-greedy-max-groups", 5);
var gameIllustration = new VersusGame("basic", "basic", "#game-illustration");
var matchRandomGreedyCells = new VersusGame("basic", "greedyMaxCells", "#match-random-vs-greedy-cells", 7, 50, 300, 50);
var matchRandomGreedyGroups = new VersusGame("greedyMaxCells", "greedyMaxGroups", "#match-random-vs-greedy-groups", 7, 50, 300, 50);
var matchHumanGreedyCells = new HumanGame("greedyMaxCells", "#match-human-vs-greedy-cells", "#stats-match-human-vs-greedy-cells");
