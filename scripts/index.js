const W = 63;
const H = 63;
const KEYCODES = `csryg ><`;
const DIGITS = `0123456789`;
let timer = false;
let hertz = 16;

let rules = { born: [3], survive: [2, 3] };

const col0 = "#1ac3ff";
const col1 = "hsl(343, 80%, 20%)";
// const col1 = "rgb(90, 10, 33)";
const col2 = "#8effaf";

const c_active = "#00ffdb";
const c_paused = "#ff6e6e";
let cellColours = [col0, col1];

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

const run = _ => {
	run_btn.style.backgroundColor = c_active;
	counter.innerHTML = 0;
	timer = setInterval(evolve, 1000 / hertz);
}

document.getElementById(`stop-evol`).addEventListener(`click`, stopEvolution);
document.getElementById(`evolve-one-gen`).addEventListener(`click`, evolve);
document.getElementById(`save`).addEventListener(`click`, saveCellPattern);
document.getElementById(`kill-all`).addEventListener(`click`, killAllCells);
document.getElementById(`wake-all`).addEventListener(`click`, wakeAllCells);
document.getElementById(`random`).addEventListener(`click`, initRandom);
document.getElementById(`sym-random`).addEventListener(`click`, initSymRandom);
document.getElementById(`glider-gun`).addEventListener(`click`, gliderGun);

const run_btn = document.getElementById(`evolve-cts`);
run_btn.addEventListener(`click`, run);
const counter = document.getElementById(`gen-count`);

window.addEventListener(`keydown`, ev => {
	ev.preventDefault();
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
		[killAllCells, saveCellPattern, initRandom, initSymRandom, gliderGun, timer ? stopEvolution : run, accel, retard][KEYCODES.indexOf(key)]();
	}
});

[...document.getElementsByClassName(`rule`)].forEach(r => {
	r.addEventListener(`change`, function() {
		console.log(`Rules: born: ${rules.born}, survive: ${rules.survive}`);
		const rule_type = this.name;
		console.log(`ruletype:  ${rule_type}`);
		rules[rule_type] = [];
		[...document.getElementsByName(rule_type)].forEach(box => {
			if (box.checked) {
				rules[rule_type].push(~~box.value);
				console.log(rules);
			}
		});
		console.log(`Rules: born: ${rules.born}, survive: ${rules.survive}`);
	});
});

// Start here
gliderGun();
run();

function flipState() {
	flipCellState(this);
}

function flipCellState(cell) {
	cell.state = 1 - cell.state;
	// colour_index = !cell.state ? 0 : ((cell.x + cell.y) % 2 ? 1 : 2);
	colour_index = cell.state;
	if (colour_index == 0) {
		cell.style.backgroundColor = cellColours[0];
	}
	else {
		let col = cellColours[1];
		// "hsl(343, 80%, 20%)"
		col = `hsl(${counter.innerHTML % 360}, 80%, 20%)`;
		cell.style.backgroundColor = cellColours[1] = col;
	}
}

function killAllCells() {
	stopEvolution();
	counter.innerHTML = 0;
	cells.forEach(cell => kill(cell));
}

function wakeAllCells() {
	stopEvolution();
	counter.innerHTML = 0;
	cells.forEach(cell => wake(cell));
}

function initRandom() {
	clearInterval(timer);
	counter.innerHTML = 0;
	cells.forEach(cell => [kill, wake][~~(Math.random() * 3 < 1)](cell));
}

function initSymRandom() {
	clearInterval(timer);
	counter.innerHTML = 0;
	const first_quadrant = [...Array(W * H).keys()].filter((x, i) => (pos = indexToPos(i)).x < W / 2 && pos.y < H / 2);
	for (const i of first_quadrant) {
		s = ~~(Math.random() * 3 < 1);
		({x, y} = indexToPos(i));
		[kill, wake][s](cells[posToIndex(x, y)]);
		[kill, wake][s](cells[posToIndex(W - x - 1, y)]);
		[kill, wake][s](cells[posToIndex(x, H - y - 1)]);
		[kill, wake][s](cells[posToIndex(W - x - 1, H - y - 1)]);
	}
}

function gliderGun() {
	// Gosper Glider Gun
	clearInterval(timer);
	counter.innerHTML = 0;
	cells.forEach(cell => kill(cell));

	lines = [0x0000004000, 0x0000014000, 0x006060018, 0x0008860018, 0x6010460000, 0x6011614000, 0x0010404000, 0x0008800000, 0x0006000000];
	ggun = lines.map(line => line.toString(2).padStart(40, 0));
	ggun.forEach((line, j) => {
		line.split('').forEach((ch, i) => {
			if (~~ch) {
				wake(cells[posToIndex(i, j + 1)]);
			};
		});
	});
}

function evolve() {
	cells.forEach((cell, index) => {
		cell.flip = queryStateChange(cell, index);
	});
	cells.forEach(cell => {
		if (cell.flip) flipCellState(cell);
	});
	++counter.innerHTML;
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
	return cell.state == 0 ? (rules.born.includes(nc)) : !(rules.survive.includes(nc));	
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
