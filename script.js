
var board = null
var game = new Chess()
var colour = 'w'


async function fetchMoves(fen, database) {
    const url = `https://explorer.lichess.ovh/${database}?fen=${fen}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.moves && data.moves.length > 0) {
            return data.moves; // Return the most popular next move
        } else {
            return null; // No more moves
        }
    } catch (error) {
        console.error("Error fetching data from Lichess:", error);
        throw error;
    }
}

function getRandomIndex(probabilities) {
  // Compute the cumulative distribution
  let cumulative = [];
  let sum = 0;
  for (let i = 0; i < probabilities.length; i++) {
      sum += probabilities[i];
      cumulative.push(sum);
  }

  // Generate a random number between 0 and the total sum
  let r = Math.random() * sum;

  // Find the index corresponding to the random number
  for (let i = 0; i < cumulative.length; i++) {
      if (r < cumulative[i]) {
          return i;
      }
  }

  // In case of rounding errors, return the last index
  return probabilities.length - 1;
}

// PLAYSTYLES>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>


function makeMove () {
  document.getElementById("evaluation").textContent = "";
  database = document.getElementById("database-choice").value;
  difficulty = 0;
  
  fetchMoves(game.fen(),database).then(moves => {
    if (moves === null) {noMoreMoves();}
    else {
    totals = moves.map(m => m.white + m.draws + m.black);
    sum = totals.reduce((accumulator, currentValue) => accumulator + currentValue, 0); 
    probs = totals.map(t => t/sum)
    i = getRandomIndex(probs);
    game.move(moves[i].san);
    board.position(game.fen())
  };})
  
}

function noMoreMoves() {
  document.getElementById("result").textContent = 'No more moves in database.';
}

function setColour() {
  document.getElementById("evaluation").textContent = "";
  colour = document.getElementById("color-choice").value;
  var config = {
    draggable: true,
    position: 'start',
    orientation: colour,
    onDragStart: onDragStart,
    onDrop: onDrop,
    onSnapEnd: onSnapEnd
  }
  board = Chessboard('myBoard', config);
  game.reset();
  if (colour === 'black') {
    window.setTimeout(makeMove, 250)
  }
  
}

function onDragStart (source, piece, position, orientation) {
  // do not pick up pieces if the game is over
  if (game.game_over()) return false

  // only pick up pieces for White
  if (colour === 'white') {if (piece.search(/^b/) !== -1) return false}
  if (colour === 'black') {if (piece.search(/^w/) !== -1) return false}
  
}

function onDrop (source, target) {
  // see if the move is legal
  var move = game.move({
    from: source,
    to: target,
    promotion: 'q' // NOTE: always promote to a queen for example simplicity
  })

  // illegal move
  if (move === null) return 'snapback'

  // make random legal move for black
  window.setTimeout(makeMove, 250)
}

// update the board position after the piece snap
// for castling, en passant, pawn promotion
function onSnapEnd () {
  board.position(game.fen())
}

async function getEvaluation(fen) {
  const url = `https://lichess.org/api/cloud-eval?fen=${encodeURIComponent(fen)}`;
  try {
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.pvs && data.pvs.length > 0) {
          const evalScore = data.pvs[0].cp ? data.pvs[0].cp / 100 : "Mate in " + data.pvs[0].mate;
          document.getElementById("evaluation").textContent = `${evalScore}`;
      } else {
          document.getElementById("evaluation").textContent = "No evaluation available.";
      }
  } catch (error) {
      console.error("Error fetching evaluation:", error);
      document.getElementById("evaluation").textContent = "Error fetching evaluation.";
  }
}



