/// <reference path="./underscore.d.ts" />
/// <reference path="./d3.d.ts"/>

class Cell {
  x: number;
  y: number;
  owner: string;
  value: number;
  connex: Cell[];

  constructor(x:number, y:number, value:number) {
    this.x = x;
    this.y = y;
    this.owner = "";
    this.value = value;
    this.connex = [this];
  }
}

interface AI {
  game: Game;
  zone: Cell[];
  color: string;

  // one step of the strategy
  oneStep () : boolean

  // force extension with d (d must be in the candidates)
  extend(d): boolean
}

class BasicAI implements AI {
  i: number;
  game: Game;
  zone: Cell[];
  color: string;
  next: Cell[];

  constructor(game: Game, zone: Cell[], color: string) {
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
      var index = _.findIndex(cell.connex, function(d){return d.x === cell.x && d.y === cell.y});
      cell.connex.splice(index, 1);
    }
  }

  // the AI plays
  oneStep() : boolean {
    // old the closest possible neighbours of the controlled zone
    var candidates = this.getCandidates();
    var keys = Object.keys(candidates);
    if (keys.length == 0) {
      return false;
    }
    // pick one group (the first one)
    var randomIndex = Math.floor(Math.random()*keys.length);
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
  }

  extend(d) {
    var found = false;
    var candidates = this.getCandidates();
    for (var k in candidates) {
      var groups = candidates[k];
      // check if d is in one group
      found = groups.some(function(group){
        return group.some(function(cell) {
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
        break
      }
    }
    return found;
  }
  /*
  *
  */
  getCandidates() {
    var candidates = {}
    for (var i in this.zone) {
      var cell = this.zone[i];
      var frees = this.game.freeNeighbours(cell);
      for (var f in frees){
        var free = frees[f]
        candidates[free.value] = candidates[free.value] || [];
        // we add free.connex if it isn't already in
        // as we are dealing with connex part we only check for the first element.
        var first = free.connex[0];
        var alreadyAdded = candidates[free.value].some(function(c){
          return c.some(function(cc) {
            return cc.x === first.x && cc.y === first.y
          });
        });
        if (!alreadyAdded) {
          candidates[free.value].push(free.connex);
        }

      }
    }
    return candidates;
  }


}

class HumanAI extends BasicAI {
  oneStep() {
    return false;
  }
}

class GreedyMaxGroupAI extends BasicAI {
  constructor(game: Game, zone: Cell[], color: string) {
    super(game, zone, color);
  }

  // the AI plays
  oneStep() : boolean {
    // old the closest possible neighbours of the controlled zone
    var candidates = this.getCandidates();
    var keys = Object.keys(candidates);
    if (keys.length == 0) {
      return false;
    }

    var values = keys
      .map(function(k,i) {return candidates[k]})

    // we pick the groups which have the most connex part
    var groups = _.max(values, function(v){return v.length});

    for (var g in groups) {
      var group = groups[g];
      for (var c in group) {
        var choice = group[c];
        choice.owner = this.color;
        this.zone.push(choice);
      }
    }
    return true;
  }
}

class GreedyMaxCellsAI extends BasicAI {
  constructor(game: Game, zone: Cell[], color: string) {
    super(game, zone, color);
  }

  // the AI plays
  oneStep() : boolean {
    // old the closest possible neighbours of the controlled zone

    var candidates = this.getCandidates();
    var keys = Object.keys(candidates);
    if (keys.length == 0) {
      return false;
    }

    var values = keys
      .map(function(k,i) {return candidates[k]})

    // we pick the groups which have the most connex part
    var groups = values.map(
      function(g) {
        return g.reduce(function(p,c){
          for (var cc in c){
            p.push(c[cc])
          }
          return p;
        }, []);
      }
    )

    var group = _.max(groups, function(d){return d.length});
    for (var g in group) {
      var choice = group[g];
      choice.owner = this.color;
      this.zone.push(choice);
    }
    return true;
  }
}

class Game {
  dimension: number;
  colors: number;
  world: Cell[];
  // all connex parts of the game
  zones: Cell[][];

  constructor(dimension: number, colors: number) {
    this.dimension = dimension;
    this.colors = colors;
    this.world = [];

    for (var i=0; i<dimension; i++) {
      for (var j=0; j<dimension; j++) {
        var value = Math.floor(this.colors * Math.random());
        var cell =   new Cell(
            j,
            i,
            value)
        this.world.push(cell)
        // append this cell to the connex part of it neighbours
        // or create a new connex part
        // at this time this.neighbours(cell) returns the two cells on top and on left
        // of the current cell
        var neighbours = this.neighbours(cell);
        var first = neighbours[0];

        if (neighbours.length > 0  && cell.value === first.value) {
          // we connect to the connex of the first
          first.connex.push(cell);
          cell.connex = first.connex;
        }
        if (neighbours.length == 2) {
          var second = neighbours[1];
          if (first.value == cell.value && cell.value == second.value) {
            var merge = (first.connex).concat(second.connex)
            // we update all the refs
            for (var f in first.connex) {
              var c = first.connex[f];
              c.connex = merge
            }
            for (var s in second.connex) {
              var c = second.connex[s];
              c.connex = merge
            }
            // finally e update the connex of the current cell
            cell.connex = merge;
          } else if (cell.value == second.value){
            // we connect to the connex of second
            second.connex.push(cell);
            cell.connex = second.connex;
          }
        }
      }
    }
  }

  // define the neighbourhood
  neighbours(cell: Cell) {
    var x = cell.x;
    var y = cell.y;
    var index = cell.x + this.dimension * y;
    // there is one on the left
    var n = []
    if (x > 0 && typeof(this.world[index - 1]) != "undefined") {
      n.push(this.world[index - 1]);
    }
    // there is one on the right
    if (x < this.dimension - 1 && typeof(this.world[index + 1]) != "undefined") {
      n.push(this.world[index + 1]);
    }
    if (y > 0 && typeof(this.world[index - this.dimension]) != "undefined") {
      n.push(this.world[index - this.dimension]);
    }
    if (y < this.dimension -1 && typeof(this.world[index + this.dimension]) != "undefined") {
      n.push(this.world[index + this.dimension]);
    }
    return n;
  }

  freeNeighbours(cell: Cell) {
    return this.neighbours(cell).filter(function(n) {return n.owner === ""});
  }

}

class Drawer {
  game: Game;
  svgDatas: any;
  speed: number;
  size: number;

  constructor(game: Game, speed: number, selection: string, size: number) {
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

    this.svgDatas = svg.selectAll("rect").data(game.world, function(d){return `${d.x}-${d.y}`});
    this.svgDatas.enter()
      .append("rect")
      .attr("x", function(d){return scale(d.x)})
      .attr("y", function(d){return scale(d.y)})
      .attr("width", this.size/game.dimension)
      .attr("height", this.size/game.dimension);

    this.update();
  }

  // update the graph
  update() {
    this.svgDatas
    .style("fill", function(d){
        if (d.owner != "") {
          return d.owner;
        }
        return color(d.value)
    })
    .style("opacity", function(d){
      if (d.owner != "") {
        return 1;
      }
      return 0.6;
    });
  }
}

// global colors mapping ...
 var color = d3.scale.category10();

class ExampleGame {
  colors: number;
  dimension: number;
  size: number;
  speed: number;
  game: Game;
  aistring: string;
  ai: AI;
  drawer: Drawer;
  selection: string;

  constructor(
    ai: string,
    selection: string,
    colors = 4,
    dimension = 4,
    size = 150,
    speed= 100
  ) {
    this.colors = colors;
    this.dimension = dimension;
    this.size = size;
    this.speed = speed;
    this.selection = selection;
    this.aistring = ai;
  }

  start(){
    this.game = new Game(this.dimension, this.colors);
    this.buildAI();
    this.drawer = new Drawer(this.game, this.speed, this.selection, this.size);
  }

  oneStep() {
    var one = this.ai.oneStep();
    this.drawer.update();
    return one;
  }

  buildAI(){
    if (this.aistring == "basic") {
      this.ai = new BasicAI(this.game, [this.game.world[0]], "red");
    } else if (this.aistring == "greedyMaxCells") {
      this.ai = new GreedyMaxCellsAI(this.game, [this.game.world[0]], "red");
    } else if (this.aistring == "greedyMaxGroups") {
      this.ai = new GreedyMaxGroupAI(this.game, [this.game.world[0]], "red");
    }
  }

}

class VersusGame {
  colors: number;
  dimension: number;
  size: number;
  speed: number;
  game: Game;
  ai1string: string;
  ai1: AI;
  ai2string: string;
  ai2: AI;
  drawer: Drawer;
  selection: string;
  displayStats: any;
  statsSelection: string;
  displayScore: any;
  scoreSelection: string;
  ai1Score: number;
  ai2Score: number;

  constructor(
    ai1: string,
    ai2: string,
    selection: string,
    statsSelection: string,
    scoreSelection: string,
    colors = 4,
    dimension = 4,
    size = 150,
    speed= 100
  ) {
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
  }

  start(){
    this.game = new Game(this.dimension, this.colors);
    this.displayStats = d3.select(this.statsSelection);
    this.displayScore = d3.select(this.scoreSelection);
    this.ai1 = this.buildAI(this.ai1string, 0, "red");
    this.ai2 = this.buildAI(this.ai2string, this.dimension*this.dimension - 1, "blue");
    this.drawer = new Drawer(this.game, this.speed, this.selection, this.size);

    if (this.ai1string === "human") {
      this.drawer.svgDatas.on("click", (d) => {
        // check if d is in the candidates
        if (this.ai1.extend(d)){
          // ai step
          this.ai2.oneStep();
          this.drawer.update();
          var stats = this.currentStats();
          var color = "red";
          if (stats.ai1 >= stats.ai2) {
            color = "red"
          } else {
            color = "blue"
          }
          this.displayStats.style("background-color", color)
        };

      });
    }
    this.drawer.update();
  }

  buildAI(aistring: string, start: number, color: string){
    if (aistring == "basic") {
      return new BasicAI(this.game, [this.game.world[start]], color);
    } else if (aistring == "greedyMaxCells") {
      return new GreedyMaxCellsAI(this.game, [this.game.world[start]], color);
    } else if (aistring == "greedyMaxGroups") {
      return new GreedyMaxGroupAI(this.game, [this.game.world[start]], color);
    } else if (aistring == "human") {
        return new HumanAI(this.game, [this.game.world[start]], color);
    }
  }

  oneStep() {
    var one = this.ai1.oneStep();
    var two = this.ai2.oneStep();
    this.drawer.update();
    return one || two;
  }

  launch() {
    if (this.oneStep()) {
      setTimeout(() => {this.launch()}, this.speed);
    } else {
      this.updateScore();
    }
  }

  updateScore() {
    if (this.ai1.zone.length < this.ai2.zone.length) {
      this.ai2Score ++;
    } else if (this.ai1.zone.length > this.ai2.zone.length) {
      this.ai1Score ++;
    }

    this.displayScore.html(
    `<span class="${this.ai1.color}">${this.ai1Score}</span>
    /
    <span class="${this.ai2.color}">${this.ai2Score}</span>`);


  }

  launchFast(){
    while(this.oneStep()){
    }
    this.updateScore();
  }

  currentStats() {
    return {
      ai1: this.ai1.zone.length,
      ai2: this.ai2.zone.length
    }
  }

  globalStats(){

  }

}


var ruleGame = new ExampleGame(
  "basic",
  "#rules"
);

var stratRandomGame = new ExampleGame(
  "basic",
  "#strat-random"
);

var stratGreedyMaxCellsGame = new ExampleGame(
  "greedyMaxCells",
  "#strat-greedy-max-cells"
);

var stratGreedyMaxGroupsGame = new ExampleGame(
  "greedyMaxGroups",
  "#strat-greedy-max-groups",
  5
);

var gameIllustration = new VersusGame(
  "basic",
  "basic",
  "#game-illustration",
  "#stats-game-illustration",
  "#score-game-illustration"
)

var matchRandomGreedyCells = new VersusGame(
  "basic",
  "greedyMaxCells",
  "#match-random-vs-greedy-cells",
  "#stats-match-random-vs-greedy-cells",
  "#score-match-random-vs-greedy-cells",
  7,
  50,
  300,
  50
)

var matchRandomGreedyGroups = new VersusGame(
  "greedyMaxCells",
  "greedyMaxGroups",
  "#match-random-vs-greedy-groups",
  "#stats-match-random-vs-greedy-groups",
  "#score-match-random-vs-greedy-groups",
  7,
  50,
  300,
  50
)

var matchHumanGreedyCells = new VersusGame(
  "human",
  "greedyMaxCells",
  "#match-human-vs-greedy-cells",
  "#stats-match-human-vs-greedy-cells",
  "#score-match-human-vs-greedy-cells",
  7,
  20,
  500
)
