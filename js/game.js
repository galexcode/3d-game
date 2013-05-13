  // Graphics Definitions

  var mesh, scene, camera, renderer;
  var player;
  var input = new InputManager();
  var cameraOffset = new THREE.Vector3(0, 40, 25);

  // Physics Definitions

  var b2Vec2 = Box2D.Common.Math.b2Vec2;
  var b2BodyDef = Box2D.Dynamics.b2BodyDef;
  var b2Body = Box2D.Dynamics.b2Body;
  var b2FixtureDef = Box2D.Dynamics.b2FixtureDef;
  var b2Fixture = Box2D.Dynamics.b2Fixture;
  var b2World = Box2D.Dynamics.b2World;
  var b2MassData = Box2D.Collision.Shapes.b2MassData;
  var b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape;
  var b2CircleShape = Box2D.Collision.Shapes.b2CircleShape;
  var b2DebugDraw = Box2D.Dynamics.b2DebugDraw;

  var bodyDef = new b2BodyDef();
  var fixDef = new b2FixtureDef();

  var world = new b2World(
  new b2Vec2(0, 0), // Gravity
  true // Allow objects to sleep
  );

  var debugDraw = new b2DebugDraw();

  // Initialization

  $(document).ready(function() {
    init();
    gameLoop();
  });

  $(window).resize(onWindowResize);

  function init() {
    var physicsOffset = 100;
    initDebugDrawing();
    initCamera();
    onWindowResize();
    scene = new THREE.Scene();
    mesh = addSphere();
    mesh.position.x = 100;
    addFloor();
    addLight();

    var jsonLoader = new THREE.JSONLoader();
    jsonLoader.load("res/models/android.js", function(geometry, materials) {
      player = {};
      player.rotOffset = Math.PI / 2;
      player.model = addModel(geometry, materials);
      fixDef.shape = new b2CircleShape();
      fixDef.shape.SetRadius(2.5);
      bodyDef.type = b2Body.b2_dynamicBody; // balls can move
      bodyDef.userData = player;
      bodyDef.position.x = 50 + physicsOffset;
      bodyDef.position.y = 0 + physicsOffset;
      player.body = world.CreateBody(bodyDef);
      player.body.CreateFixture(fixDef); // Add this physics body to the world
      player.body.SetFixedRotation(true);
    });

    jsonLoader.load("res/models/fern/fern.js", function(geometry, materials) {
      var fern = addModel(geometry, materials);
    });

    jsonLoader.load("res/models/interior.js", function(geometry, materials) {
      var go = {};
      go.model = addModel(geometry, materials);
      go.model.position.y = 1;
      fixDef.shape = new b2PolygonShape();
      fixDef.shape.SetAsBox(33, 43); // "25" = half width of the ramp, "1" = half height
      bodyDef.type = b2Body.b2_staticBody; // Objects defined in this function are all static
      bodyDef.userData = go;
      bodyDef.position.x = 50 + physicsOffset;
      bodyDef.position.y = 50 + physicsOffset;
      go.body = world.CreateBody(bodyDef);
      go.body.CreateFixture(fixDef); // Add this physics body to the world
    });

    document.body.appendChild(renderer.domElement);
  }

  function initDebugDrawing() {
    var debugDraw = new b2DebugDraw();
    debugDraw.SetSprite(document.getElementById("c").getContext("2d"));
    debugDraw.SetDrawScale(2);
    debugDraw.SetFillAlpha(0.3);
    debugDraw.SetLineThickness(1.0);
    debugDraw.SetFlags(b2DebugDraw.e_shapeBit | b2DebugDraw.e_jointBit);
    world.SetDebugDraw(debugDraw);
  }

  function initCamera() {
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
    camera.position.copy(cameraOffset);
    camera.lookAt(new THREE.Vector3(0, 0, 0));
    camera.locked = true;
    renderer = new THREE.WebGLRenderer();
  }

  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  function gameLoop() {
    requestAnimationFrame(gameLoop);
    update();
    draw();
    input.update();
  }

  function update() {
    if (mesh) {
      mesh.rotation.x += 0.01;
      mesh.rotation.y += 0.02;
    }
    if (player) {
      updatePlayer();
      updateCamera();
    }
    if (input.isKeyTriggered(VK_P)) {
      saveScene();
    }
    updatePhysics();
  }

  function updatePlayer() {
    var speed = 50;
    var left = input.isKeyDown(VK_A);
    var right = input.isKeyDown(VK_D);
    var down = input.isKeyDown(VK_S);
    var up = input.isKeyDown(VK_W);
    var angle;
    if (right) {
      if (up) angle = -45;
      else if (down) angle = 45;
      else angle = 0;
    } else if (left) {
      if (up) angle = -135;
      else if (down) angle = 135;
      else angle = 180;
    } else if (down) {
      angle = 90;
    } else if (up) {
      angle = -90;
    }
    if (angle !== undefined) {
      var angleRad = THREE.Math.degToRad(angle);
      player.body.SetAngle(angleRad);
      var vel = new b2Vec2(Math.cos(angleRad) * speed, Math.sin(angleRad) * speed);
      player.body.SetAwake(true);
      player.body.SetLinearVelocity(vel);
    } else {
      player.body.SetLinearVelocity(new b2Vec2());
    }
  }

  function updateCamera() {
    if (input.isKeyTriggered(VK_L)) {
      camera.locked = !camera.locked;
      console.log("Camera locked: " + camera.locked);
    }
    if (camera.locked) {
      camera.position.addVectors(cameraOffset, player.model.position);
      camera.lookAt(player.model.position);
    } else {
      var speed = 10;
      if (input.isKeyDown(VK_LEFT)) camera.position.x -= speed;
      if (input.isKeyDown(VK_RIGHT)) camera.position.x += speed;
      if (input.isKeyDown(VK_UP)) camera.position.z -= speed;
      if (input.isKeyDown(VK_DOWN)) camera.position.z += speed;
      if (input.isKeyDown(VK_ADD)) camera.position.y -= speed;
      if (input.isKeyDown(VK_SUB)) camera.position.y += speed;
    }
  }

  function updatePhysics() {
    world.Step(1 / 60, 10, 10);

    var object = world.GetBodyList(),
      go, position;
    while (object) {
      go = object.GetUserData();

      if (go) {
        position = object.GetPosition();
        go.model.position.x = position.x;
        go.model.position.z = position.y;
        go.model.rotation.y = 2 * Math.PI - object.GetAngle() + (go.rotOffset ? go.rotOffset : 0);
      }
      object = object.GetNext(); // Get the next object in the scene
    }
    world.DrawDebugData();
    world.ClearForces();
  }

  function saveScene() {
    var exporter = new THREE.ObjectExporter();
    var output = JSON.stringify(exporter.parse(scene), null, '\t');
    output = output.replace(/[\n\t]+([\d\.e\-\[\]]+)/g, '$1');
    var blob = new Blob([output], {
      type: 'text/plain'
    });
    var objectURL = URL.createObjectURL(blob);
    window.open(objectURL, '_blank');
    window.focus();
  }

  function draw() {
    if (scene && camera) {
      renderer.render(scene, camera);
    }
  }

  function addCube() {
    var geometry = new THREE.CubeGeometry(200, 200, 200);
    var material = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      wireframe: true
    });

    var cube = new THREE.Mesh(geometry, material);
    scene.add(cube);
    return mesh;
  }

  function addSphere() {
    // set up the sphere vars
    var radius = 5,
      segments = 16,
      rings = 16;

    // create the sphere's material
    var sphereMaterial = new THREE.MeshLambertMaterial({
      color: 0xff0000
    });

    var sphere = new THREE.Mesh(

    new THREE.SphereGeometry(
    radius,
    segments,
    rings),

    sphereMaterial);

    // add the sphere to the scene
    scene.add(sphere);
    return sphere;
  }

  function addLight() {
    // create a point light
    var pointLight = new THREE.PointLight(0xffffff);

    // set its position
    pointLight.position.x = 10;
    pointLight.position.y = 50;
    pointLight.position.z = 130;

    // add to the scene
    scene.add(pointLight);
    return pointLight;
  }

  function addFloor() {
    var floorTexture = new THREE.ImageUtils.loadTexture('res/images/grass.png');
    floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;
    floorTexture.repeat.set(400, 400);
    // DoubleSide: render texture on both sides of mesh
    var floorMaterial = new THREE.MeshPhongMaterial({
      map: floorTexture,
      side: THREE.DoubleSide
    });
    var floorGeometry = new THREE.PlaneGeometry(5000, 5000, 1, 1);
    var floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.y = 0;
    floor.rotation.x = Math.PI / 2;
    scene.add(floor);
  }

  function addModel(geometry, materials) {
    var material = new THREE.MeshFaceMaterial(materials);
    var model = new THREE.Mesh(geometry, material);
    scene.add(model);
    return model;
  }