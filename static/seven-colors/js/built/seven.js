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
}());
var BasicAI = (function () {
    function BasicAI(game, zone, color) {
        this.game = game;
        this.zone = zone;
        this.color = color;
        this.i = 0;
        for (var i in zone) {
            var cell = zone[i];
            cell.owner = this.color;
            var index = _.findIndex(cell.connex, function (d) { return d.x === cell.x && d.y === cell.y; });
            cell.connex.splice(index, 1);
        }
    }
    BasicAI.prototype.oneStep = function () {
        var candidates = this.getCandidates();
        var keys = Object.keys(candidates);
        if (keys.length == 0) {
            return false;
        }
        var randomIndex = Math.floor(Math.random() * keys.length);
        var groups = candidates[keys[randomIndex]];
        for (var g in groups) {
            var group = groups[g];
            for (var c in groups[g]) {
                var choice = group[c];
                choice.owner = this.color;
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
            found = groups.some(function (group) {
                return group.some(function (cell) {
                    return cell.x === d.x && cell.y === d.y;
                });
            });
            if (found) {
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
    BasicAI.prototype.getCandidates = function () {
        var candidates = {};
        for (var i in this.zone) {
            var cell = this.zone[i];
            var frees = this.game.freeNeighbours(cell);
            for (var f in frees) {
                var free = frees[f];
                candidates[free.value] = candidates[free.value] || [];
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
}());
var HumanAI = (function (_super) {
    __extends(HumanAI, _super);
    function HumanAI() {
        _super.apply(this, arguments);
    }
    HumanAI.prototype.oneStep = function () {
        return false;
    };
    return HumanAI;
}(BasicAI));
var GreedyMaxGroupAI = (function (_super) {
    __extends(GreedyMaxGroupAI, _super);
    function GreedyMaxGroupAI(game, zone, color) {
        _super.call(this, game, zone, color);
    }
    GreedyMaxGroupAI.prototype.oneStep = function () {
        var candidates = this.getCandidates();
        var keys = Object.keys(candidates);
        if (keys.length == 0) {
            return false;
        }
        var values = keys
            .map(function (k, i) { return candidates[k]; });
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
}(BasicAI));
var GreedyMaxCellsAI = (function (_super) {
    __extends(GreedyMaxCellsAI, _super);
    function GreedyMaxCellsAI(game, zone, color) {
        _super.call(this, game, zone, color);
    }
    GreedyMaxCellsAI.prototype.oneStep = function () {
        var candidates = this.getCandidates();
        var keys = Object.keys(candidates);
        if (keys.length == 0) {
            return false;
        }
        var values = keys
            .map(function (k, i) { return candidates[k]; });
        var groups = values.map(function (g) {
            return _.flatten(g);
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
}(BasicAI));
var RusherAI = (function (_super) {
    __extends(RusherAI, _super);
    function RusherAI(game, zone, color) {
        _super.call(this, game, zone, color);
    }
    RusherAI.prototype.oneStep = function () {
        var candidates = this.getCandidates();
        var keys = Object.keys(candidates);
        if (keys.length == 0) {
            return false;
        }
        var values = keys
            .map(function (k, i) { return candidates[k]; });
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
    return RusherAI;
}(BasicAI));
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
                var neighbours = this.neighbours(cell);
                var first = neighbours[0];
                if (neighbours.length > 0 && cell.value === first.value) {
                    first.connex.push(cell);
                    cell.connex = first.connex;
                }
                if (neighbours.length == 2) {
                    var second = neighbours[1];
                    if (first.value == cell.value && cell.value == second.value) {
                        var merge = (first.connex).concat(second.connex);
                        for (var f in first.connex) {
                            var c = first.connex[f];
                            c.connex = merge;
                        }
                        for (var s in second.connex) {
                            var c = second.connex[s];
                            c.connex = merge;
                        }
                        cell.connex = merge;
                    }
                    else if (cell.value == second.value) {
                        second.connex.push(cell);
                        cell.connex = second.connex;
                    }
                }
            }
        }
    }
    Game.prototype.neighbours = function (cell) {
        var x = cell.x;
        var y = cell.y;
        var index = cell.x + this.dimension * y;
        var n = [];
        if (x > 0 && typeof (this.world[index - 1]) != "undefined") {
            n.push(this.world[index - 1]);
        }
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
}());
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
}());
var color = d3.scale.category10();
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
}());
var GameState;
(function (GameState) {
    GameState[GameState["Created"] = 0] = "Created";
    GameState[GameState["Started"] = 1] = "Started";
    GameState[GameState["Running"] = 2] = "Running";
    GameState[GameState["Finished"] = 3] = "Finished";
})(GameState || (GameState = {}));
var VersusGame = (function () {
    function VersusGame(ai1, ai2, selection, statsSelection, scoreSelection, colors, dimension, size, speed) {
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
        this.statsSelection = statsSelection;
        this.ai1Score = 0;
        this.ai2Score = 0;
        this.scoreSelection = scoreSelection;
        this.state = GameState.Created;
    }
    VersusGame.prototype.start = function () {
        var _this = this;
        clearTimeout(this.nextIteration);
        this.game = new Game(this.dimension, this.colors);
        this.displayStats = d3.select(this.statsSelection);
        this.displayScore = d3.select(this.scoreSelection);
        this.ai1 = this.buildAI(this.ai1string, 0, "red");
        this.ai2 = this.buildAI(this.ai2string, this.dimension * this.dimension - 1, "blue");
        this.drawer = new Drawer(this.game, this.speed, this.selection, this.size);
        if (this.ai1string === "human") {
            this.drawer.svgDatas.on("click", function (d) {
                if (_this.ai1.extend(d)) {
                    _this.ai2.oneStep();
                    _this.drawer.update();
                    var stats = _this.currentStats();
                    var color = "red";
                    if (stats.ai1 >= stats.ai2) {
                        color = "red";
                    }
                    else {
                        color = "blue";
                    }
                    _this.displayStats.style("background-color", color);
                }
                ;
            });
        }
        this.drawer.update();
        this.state = GameState.Started;
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
        else if (aistring == "human") {
            return new HumanAI(this.game, [this.game.world[start]], color);
        }
    };
    VersusGame.prototype.oneStep = function () {
        var one = this.ai1.oneStep();
        var two = this.ai2.oneStep();
        this.drawer.update();
        return one || two;
    };
    VersusGame.prototype.launch = function () {
        switch (this.state) {
            case GameState.Started:
                this.state = GameState.Running;
                this._launch();
                break;
            default:
                return;
        }
    };
    VersusGame.prototype.updateScore = function () {
        if (this.ai1.zone.length < this.ai2.zone.length) {
            this.ai2Score++;
        }
        else if (this.ai1.zone.length > this.ai2.zone.length) {
            this.ai1Score++;
        }
        this.displayScore.html("<span class=\"" + this.ai1.color + "\">" + this.ai1Score + "</span>\n    /\n    <span class=\"" + this.ai2.color + "\">" + this.ai2Score + "</span>");
    };
    VersusGame.prototype.launchFast = function () {
        switch (this.state) {
            case GameState.Started:
                this.state = GameState.Running;
                while (this.oneStep()) {
                }
                this.updateScore();
                break;
            default:
                return;
        }
    };
    VersusGame.prototype.currentStats = function () {
        return {
            ai1: this.ai1.zone.length,
            ai2: this.ai2.zone.length
        };
    };
    VersusGame.prototype.globalStats = function () {
    };
    VersusGame.prototype._launch = function () {
        var _this = this;
        if (this.oneStep()) {
            this.nextIteration = setTimeout(function () { _this._launch(); }, this.speed);
        }
        else {
            this.updateScore();
            this.state = GameState.Finished;
        }
    };
    return VersusGame;
}());
var ruleGame = new ExampleGame("basic", "#rules");
var stratRandomGame = new ExampleGame("basic", "#strat-random");
var stratGreedyMaxCellsGame = new ExampleGame("greedyMaxCells", "#strat-greedy-max-cells");
var stratGreedyMaxGroupsGame = new ExampleGame("greedyMaxGroups", "#strat-greedy-max-groups", 5);
var gameIllustration = new VersusGame("basic", "basic", "#game-illustration", "#stats-game-illustration", "#score-game-illustration");
var matchRandomGreedyCells = new VersusGame("basic", "greedyMaxCells", "#match-random-vs-greedy-cells", "#stats-match-random-vs-greedy-cells", "#score-match-random-vs-greedy-cells", 7, 50, 300, 50);
var matchRandomGreedyGroups = new VersusGame("greedyMaxCells", "greedyMaxGroups", "#match-random-vs-greedy-groups", "#stats-match-random-vs-greedy-groups", "#score-match-random-vs-greedy-groups", 7, 50, 300, 50);
var matchHumanGreedyCells = new VersusGame("human", "greedyMaxCells", "#match-human-vs-greedy-cells", "#stats-match-human-vs-greedy-cells", "#score-match-human-vs-greedy-cells", 7, 20, 500);
