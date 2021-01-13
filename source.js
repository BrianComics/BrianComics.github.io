class Rectangle {
	constructor (x, y, width, height, color, options) {
		this.size = {
			width : width,
			height: height
		};
		this.color   = color;
		this.options = options;

		this.body = Matter.Bodies.rectangle(x, y, width, height, this.options);
	}

	draw () {
		c.fillStyle   = this.color;
		c.shadowColor = this.color;
		c.shadowBlur  = bodies_settings.glow;

		c.save();
		c.translate(this.body.position.x, this.body.position.y);
		c.rotate(this.body.angle);
		c.fillRect(-this.size.width / 2, -this.size.height / 2, this.size.width, this.size.height);
		c.restore();
	}
}


const colours = [
	"rgba(214, 48, 49)", 
	"rgba(9, 132, 227)", 
	"rgba(0, 184, 148)", 
	"rgba(253, 203, 110)", 
	"rgba(108, 92, 231)", 
	"rgb(223, 230, 233)"
];
const wall_thickness = 1000;


const canvas  = document.getElementById("canvas");
canvas.width  = window.innerWidth;
canvas.height = window.innerHeight;
const c       = canvas.getContext("2d");


let engine = Matter.Engine.create();


let drag_control = Matter.MouseConstraint.create(engine, {mouse: Matter.Mouse.create(canvas)});
drag_control.constraint.stiffness = 0.01;
Matter.World.add(engine.world, [drag_control]);


let simulation_settings = {
	gravity: {
		scale: 0.001,
		x    : 0,
		y    : 1
	},
	time: {
		scale        : 1,
		freezing_data: {
			is_frozen   : false,
			friction_air: 1,
			time_scale  : 1
		},
		freeze: () => {
			if (simulation_settings.time.freezing_data.is_frozen == false) {
				simulation_settings.time.freezing_data.friction_air = bodies_settings.friction.air;
				simulation_settings.time.freezing_data.time_scale   = simulation_settings.time.scale;

				simulation_settings.time.freezing_data.is_frozen = true;
				simulation_settings.time.scale                   = 0.1;
				bodies_settings.friction.air                     = 1;
			} else {
				simulation_settings.time.freezing_data.is_frozen = false;
				bodies_settings.friction.air                     = simulation_settings.time.freezing_data.friction_air;
				simulation_settings.time.scale                   = simulation_settings.time.freezing_data.time_scale;
			}
		}
	}
}

let bodies_settings = {
	friction: {
		normal: 0.1,
		air   : 0.01,
		static: 0.5
	},
	restitution: 0,
	glow       : 0
}


const gui = new dat.GUI({
	autoPlace: false,
	width    : 750
});

const properties_folder = gui.addFolder("Body Properties");
properties_folder.add(bodies_settings.friction,      "normal", 0,  1, 0.01).name("Friction: How much does it slow down during collisions?");
properties_folder.add(bodies_settings.friction,         "air", 0,  1, 0.01).name("Air Friction: How much does it slow down during flight?");
properties_folder.add(bodies_settings.friction,      "static", 0, 10, 0.01).name("Static Friction: How much does it slow down over time?");
properties_folder.add(         bodies_settings, "restitution", 0,  1, 0.01).name("Restitution: How many times & how high can it bounce?");
properties_folder.add(         bodies_settings,        "glow", 0, 30,    1).name("Intensity: How bright does it glow? ( Warning: Laggy! )");
properties_folder.open();

const gravity_folder = gui.addFolder("Gravity");
gravity_folder.add(simulation_settings.gravity, "scale",  0, 0.01, 0.01).name("Strength: How strong is the gravity in this simulation?");
gravity_folder.add(simulation_settings.gravity,     "x", -1,    1, 0.01).name("X: Which direction, if any, should horizontal gravity pull?");
gravity_folder.add(simulation_settings.gravity,     "y", -1,    1, 0.01).name("Y: Which direction, if any, should vertical gravity pull?");
gravity_folder.open();

const time_folder = gui.addFolder("Time");
time_folder.add(simulation_settings.time, "scale", 0.1, 1, 0.01).name("Scale: How slowly does time move in this simulation?");
time_folder.add(simulation_settings.time, "freeze"             ).name("Freeze: Should time move at all in this simulation?");
time_folder.open();

document.getElementById("controls-container").appendChild(gui.domElement);


let bodies = [];

let colour = colours[Math.floor(Math.random() * colours.length)];

let left_stack = Matter.Composites.stack((canvas.width / 2) - 450, canvas.height - 150, 5, 5, 0, 0, (x, y) => {
	let body = new Rectangle(x, y, 30, 30, colour, {});
	bodies.push(body);
	return body.body;
});

let right_stack = Matter.Composites.stack((canvas.width / 2) + 300, canvas.height - 150, 5, 5, 0, 0, (x, y) => {
	let body = new Rectangle(x, y, 30, 30, colour, {});
	bodies.push(body);
	return body.body;
});

colour = colours[Math.floor(Math.random() * colours.length)];

let middle_stack = Matter.Composites.stack((canvas.width / 2) - 225, canvas.height - 450, 15, 15, 0, 0, (x, y) => {
	let body = new Rectangle(x, y, 30, 30, colour, {});
	bodies.push(body);
	return body.body;
});

Matter.World.add(engine.world, [
	new Rectangle(                 canvas.width / 2,                -wall_thickness / 2, canvas.width + wall_thickness,                 wall_thickness, "rgba(0, 0, 0, 0)", {isStatic: true}).body,
	new Rectangle(                 canvas.width / 2, canvas.height + wall_thickness / 2, canvas.width + wall_thickness,                 wall_thickness, "rgba(0, 0, 0, 0)", {isStatic: true}).body,
	new Rectangle(              -wall_thickness / 2,                  canvas.height / 2,                wall_thickness, canvas.height + wall_thickness, "rgba(0, 0, 0, 0)", {isStatic: true}).body,
	new Rectangle(canvas.width + wall_thickness / 2,                  canvas.height / 2,                wall_thickness, canvas.height + wall_thickness, "rgba(0, 0, 0, 0)", {isStatic: true}).body,
	left_stack,
	right_stack,
	middle_stack
]);


let game_loop = () => {
	window.requestAnimationFrame(game_loop);

	c.fillStyle = "rgba(45, 52, 54, 1)";
	c.fillRect(0, 0, canvas.width, canvas.height);

	bodies.forEach(body => {
		body.body.friction       = bodies_settings.friction.normal;
		body.body.frictionAir    = bodies_settings.friction.air;
		body.body.frictionStatic = bodies_settings.friction.static;

		body.body.restitution = bodies_settings.restitution;

		body.draw();
	});

	engine.world.gravity.scale = simulation_settings.gravity.scale;
	engine.world.gravity.x     = simulation_settings.gravity.x;
	engine.world.gravity.y     = simulation_settings.gravity.y;

	engine.constraintIterations = Math.round(2 / simulation_settings.time.scale);
	engine.positionIterations   = Math.round(6 / simulation_settings.time.scale);
	engine.velocityIterations   = Math.round(4 / simulation_settings.time.scale);

	Matter.Engine.update(engine, 16 * simulation_settings.time.scale);
}

game_loop();