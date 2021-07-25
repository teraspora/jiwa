const W = 63;
const H = 63;
const KEYCODES = `csry ><`;
const DIGITS = `0123456789`;
let timer = false;
let hertz = 2;

const col0 = "#1ac3ff";
const col1 = "#5a0a21";
const col2 = "#8effaf";

const c_active = "#00ffdb";
const c_paused = "#ff6e6e";
const cellColours = [col0, col1];

const grid = document.getElementById("lgrid");

for (let j = 0; j < H; j++) {
	for (let i = 0; i < W; i++) {
		let cell = document.createElement("div");
		cell.x = i;
		cell.y = j;
		cell.state = 0;
		cell.id = `cell_${i}-${j}`;
		cell.flip = false;
		cell.style.backgroundColor = col0;
		cell.addEventListener('click', flipState)
		grid.appendChild(cell);
	}	
}

let cells = Array.from(grid.children);

let pattern_stack = [];

const accel = _ => {
	hertz = hertz * 2;
	if (timer) {
		clearInterval(timer);
		run();
	}
}

const retard = _ => {
	hertz = hertz / 2;
	if (timer) {
		clearInterval(timer);
		run();
	}
}


window.addEventListener('keydown', ev => {
	key = ev.key;
	if (DIGITS.includes(key) && pattern_stack.length > ~~key) {
		killAllCells();
		console.log(pattern_stack.length);
		console.log(pattern_stack);
		pattern_stack[~~key].forEach(i => {
			cells[i].state = 1;
			cells[i].style.backgroundColor = cellColours[1];
		});
	}
	else if (KEYCODES.includes(key)) {
		[killAllCells, saveCellPattern, initRandom, initSymRandom, timer ? stopEvolution : run, accel, retard][KEYCODES.indexOf(key)]();
	}
});

function flipState() {
	flipCellState(this);
}

function flipCellState(cell) {
	cell.state = 1 - cell.state;
	// colour_index = !cell.state ? 0 : ((cell.x + cell.y) % 2 ? 1 : 2);
	colour_index = cell.state;
	cell.style.backgroundColor = cellColours[colour_index];
}

function killAllCells() {
	stopEvolution()
	cells.forEach(cell => kill(cell));
}

function wakeAllCells() {
	stopEvolution()
	cells.forEach(cell => wake(cell));
}

const run = _ => {
	run_btn.style.backgroundColor = c_active;
	timer = setInterval(evolve, 1000 / hertz);
}

document.getElementById("stop-evol").addEventListener('click', stopEvolution);
document.getElementById("evolve-one-gen").addEventListener('click', evolve);
document.getElementById("save").addEventListener('click', saveCellPattern);
document.getElementById("kill-all").addEventListener('click', killAllCells);
document.getElementById("wake-all").addEventListener('click', wakeAllCells);
document.getElementById("random").addEventListener('click', initRandom);
document.getElementById("sym-random").addEventListener('click', initSymRandom);

const run_btn = document.getElementById("evolve-cts");
run_btn.addEventListener('click', run);

function initRandom() {
	clearInterval(timer);
	cells.forEach(cell => cell.state = ~~(Math.random() * 2));
	run();
}

function initSymRandom() {
	clearInterval(timer);
	const first_quadrant = [...Array(W * H).keys()].filter((x, i) => (pos = indexToPos(i)).x < W / 2 && pos.y < H / 2);
	for (const i of first_quadrant) {
		s = ~~(Math.random() * 2);
		({x, y} = indexToPos(i));
		cells[posToIndex(x, y)].state = s;
		cells[posToIndex(W - x - 1, y)].state = s;
		cells[posToIndex(x, H - y - 1)].state = s;
		cells[posToIndex(W - x - 1, H - y - 1)].state = s;
	}
	run();
}

function evolve() {
	cells.forEach((cell, index) => {
		cell.flip = queryStateChange(cell, index);
	});
	cells.forEach(cell => {
		if (cell.flip) flipCellState(cell);
	});
	if (!cells.some(cell => cell.state == 1)) {
		stopEvolution();
	}
}

function saveCellPattern() {
	let live_cells = cells.map((cell, i) => [i, cell.state]).filter(cd => cd[1] == 1).map(cd => cd[0]);
	pattern_stack.push(live_cells);
}

function kill(cell) {
	cell.state = 0;
	cell.style.backgroundColor = cellColours[0];
}

function wake(cell) {
	cell.state = 1;
	cell.style.backgroundColor = cellColours[1];
}


function stopEvolution() {
	run_btn.style.backgroundColor = c_paused;
	clearInterval(timer);
	timer = false;
}

function queryStateChange(cell, n) {
	let nc = countLiveNeighbours(n);
	return cell.state == 0 ? nc == 3 : nc < 2 || nc > 3;
}

function countLiveNeighbours(n) {
	let nc = 0;
	let pos = indexToPos(n);
	let x = pos.x;
	let y = pos.y;

	if (y == 0) {
		if (x == 0) {
			// top left corner - 3 neighbours
			if (cells[W].state) nc++;
			if (cells[1].state) nc++;
			if (cells[W + 1].state) nc++;			
		}
		else if (x == W - 1) {
			// top right corner - 3 neighbours
			if (cells[W - 2].state) nc++;
			if (cells[2 * W - 1].state) nc++;
			if (cells[2 * W - 2].state) nc++;
		}
		else {
			// top line - 5 neighbours
			if (cells[x - 1].state) nc++;
			if (cells[x + 1].state) nc++;
			if (cells[x - 1 + W].state) nc++;
			if (cells[x + 1 + W].state) nc++;
			if (cells[x + W].state) nc++;
		}
	}
	else if (y == H - 1) {
		if (x == 0) {
			// bottom left corner - 3 neighbours
			if (cells[(H - 2) * W].state) nc++;
			if (cells[(H - 1) * W + 1].state) nc++;
			if (cells[(H - 2) * W + 1].state) nc++;

		}
		else if (x == W - 1) {
			// bottom right corner - 3 neighbours
			if (cells[W - 2 + (H - 1) * W].state) nc++;
			if (cells[W - 1 + (H - 2) * W].state) nc++;
			if (cells[W - 2 + (H - 2) * W].state) nc++;
		}
		else {
			// bottom line - 5 neighbours
			if (cells[x - 1 + (H - 1) * W].state) nc++;
			if (cells[x + 1 + (H - 1) * W].state) nc++;
			if (cells[x - 1 + (H - 2) * W].state) nc++;
			if (cells[x + 1 + (H - 2) * W].state) nc++;
			if (cells[x + (H - 2) * W].state) nc++;
		}
	}
	else if (x == 0) {
		// left column - 5 neighbours
			if (cells[(y - 1) * W].state) nc++;
			if (cells[(y + 1) * W].state) nc++;
			if (cells[1 + (y - 1) * W].state) nc++;
			if (cells[1 + (y + 1) * W].state) nc++;
			if (cells[1 + y * W].state) nc++;
	}
	else if (x == W - 1) {
		// right column - 5 neighbours
			if (cells[W - 1 + (y - 1) * W].state) nc++;
			if (cells[W - 1 + (y + 1) * W].state) nc++;
			if (cells[W - 2 + (y - 1) * W].state) nc++;
			if (cells[W - 2 + (y + 1) * W].state) nc++;
			if (cells[W - 2 + y * W].state) nc++;
	}
	else {
		// non-edge cases - 8 neighbours
			if (cells[x - 1 + (y - 1) * W].state) nc++;
			if (cells[x + (y - 1) * W].state) nc++;
			if (cells[x + 1 + (y - 1) * W].state) nc++;
			if (cells[x - 1 + y * W].state) nc++;
			if (cells[x + 1 + y * W].state) nc++;
			if (cells[x - 1 + (y + 1) * W].state) nc++;
			if (cells[x + (y + 1) * W].state) nc++;
			if (cells[x + 1 + (y + 1) * W].state) nc++;
	}
	return nc;
}

function indexToPos(n) {
	let i = n % W;
	let j = Math.floor(n / W);
	return {x: i, y: j};
}

function posToIndex(x, y) {
	return y * W + x;
}


// { x: p, y: q }
// { x: W - p - 1, y: q }
// { x: p, y: H - q - 1  }
// { x: W - p - 1, y: H - q - 1 }


// cells[posToIndex(p, q)] = s
// cells[posToIndex(W - p - 1, q)] = s
// cells[posToIndex(p, H - q - 1 )] = s
// cells[posToIndex(W - p - 1, H - q - 1)] = s