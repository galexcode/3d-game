  // Game Definitions

  var scene, camera, renderer;
  var player;
  var input = new InputManager();
  var cameraOffset = new THREE.Vector3(0, 40, 25);
  var gameObjects = [];
  var testSerialization;
  var modelData = [];
  var prototypes = {};

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
  var b2Shape = Box2D.Collision.Shapes.b2Shape;
  var b2DebugDraw = Box2D.Dynamics.b2DebugDraw;

  var world = new b2World(new b2Vec2(0, 0), true);
  var debugDraw = new b2DebugDraw();

  // Initialization

  $(document).ready(function() {
    init();
    gameLoop();
  });

  $(window).resize(onWindowResize);

  function init() {
    initDebugDrawing();
    initCamera();
    onWindowResize();

    // scene = new THREE.Scene();
    // addFloor();
    // addLight(new THREE.Vector3(10, 50, 130), new THREE.Color('#ffffff'));
    // loadGameObject("android");
    // loadGameObject("interior");    
    loadScene("testScene");

    document.body.appendChild(renderer.domElement);
  }

  function loadGameObject(name, derived) {
    if (prototypes[name]) {
      createFromProto(prototypes[name], derived);
    } else {
      new $.getJSON("res/objects/" + name + ".js", function(proto) {
        prototypes[name] = proto;
        createFromProto(proto, derived);
      });
    }

    function createFromProto(proto, derived) {
      var go = copyObject(proto);
      if (derived) {
        go = mergeObjects(go, derived);
      }
      fixDeserializedGameObject(go);
      go.parent = name;
    }
  }

  function loadModel(modelName, callback) {
    if (modelData[modelName]) {
      if (callback) {
        callback(modelData[modelName]);
      }
    } else {
      var path = "res/models/" + modelName + "/" + modelName + ".js";
      new THREE.JSONLoader().load(path, function(geometry, materials) {
        modelData[modelName] = {
          geometry: geometry,
          materials: materials
        };
        if (callback) {
          callback(modelData[modelName]);
        }
      });
    }
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
    updateInput();
    if (player) {
      updatePlayer();
      updateCamera();
    }
    updatePhysics();
  }

  function updateInput() {
    if (input.isKeyTriggered(VK_P)) {
      saveScene();
    }
    if (input.isKeyTriggered(VK_I)) {
      if (testSerialization) deserializeScene(testSerialization);
    }
    if (input.isKeyTriggered(VK_O)) {
      testSerialization = serializeScene();
    }
    if (input.isKeyTriggered(VK_8)) {
      player = deserializeGameObject(testSerialization);
    }
    if (input.isKeyTriggered(VK_9)) {
      testSerialization = serializeGameObject(player);
    }
    if (input.isKeyTriggered(VK_0)) {
      testSerialization = saveGameObject(player);
    }
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
    if (camera.locked && player && player.model) {
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

      if (go && go.model) {
        position = object.GetPosition();
        go.model.position.x = position.x;
        go.model.position.z = position.y;
        go.model.rotation.y = 2 * Math.PI - object.GetAngle() + (go.rotOffset ? go.rotOffset : 0);
      }
      object = object.GetNext();
    }
    world.DrawDebugData();
    world.ClearForces();
  }

  function saveScene() {
    saveData(serializeScene());
  }

  function serializeScene() {
    var output = {};
    output.lights = [];
    output.prototypes = [];
    var i;
    for (i = 0; i < scene.__lights.length; i++) {
      var light = scene.__lights[i];
      output.lights[i] = {
        position: light.position,
        color: light.color
      };
    }
    for (i = 0; i < gameObjects.length; i++) {
      var go = gameObjects[i];
      var p = go.parent;
      go = serializePrepGameObject(go);
      var proto = serializePrepGameObject(prototypes[p]);
      output.prototypes[i] = compareJSON(proto, go);
    }
    var data = JSON.stringify(output, null, '\t');
    for (i = 0; i < gameObjects.length; i++) {
      serializeFixGameObject(gameObjects[i]);
    }
    return data;
  }

  function serializeGameObject(go) {
    var output = serializePrepGameObject(go);
    var data = JSON.stringify(output);
    serializeFixGameObject(go);
    return data;
  }

  function saveGameObject(go) {
    saveData(serializeGameObject(go));
  }

  function saveData(data) {
    var blob = new Blob([data], {
      type: 'text/json'
    });
    var objectURL = URL.createObjectURL(blob);
    window.open(objectURL, '_blank');
    window.focus();
  }

  function serializePrepGameObject(go) {
    go.bodyDef.userData = undefined;
    if (go.body) go.bodyDef.position = go.body.GetPosition();
    return {
      parent: go.parent,
      bodyDef: go.bodyDef,
      fixDef: go.fixDef,
      modelName: go.modelName,
      isPlayer: go.isPlayer,
      rotOffset: go.rotOffset
    };
  }

  function serializeFixGameObject(go) {
    go.bodyDef.userData = go;
  }

  function deserializeScene(data) {
    scene = new THREE.Scene();
    clearWorld();
    gameObjects = [];
    var input = typeof(data) == 'object' ? data : JSON.parse(data);
    var i;
    for (i = 0; i < input.lights.length; i++) {
      addLight(input.lights[i].position, input.lights[i].color);
    }
    for (i = 0; i < input.prototypes.length; i++) {
      var proto = input.prototypes[i];
      var go = loadGameObject(proto.parent, proto);
    }
    addFloor();
  }

  function loadScene(name) {
    $.getJSON("res/scenes/" + name + ".js", deserializeScene);
  }

  function fixDeserializedGameObject(go) {
    var fixDef = new b2FixtureDef();
    fixDef.shape = go.fixDef.shape.m_type === 0 ? new b2CircleShape() : new b2PolygonShape();
    go.bodyDef = mergeObjects(new b2BodyDef(), go.bodyDef);
    go.bodyDef.userData = go;
    go.fixDef = mergeObjects(fixDef, go.fixDef);
    go.body = world.CreateBody(go.bodyDef);
    go.body.CreateFixture(go.fixDef);
    if (go.modelName) {
      loadModel(go.modelName, function(md) {
        go.model = addModel(md.geometry, md.materials);
      });
    }
    if (go.isPlayer) player = go;
    gameObjects.push(go);
    return go;
  }

  function deserializeGameObject(data) {
    var go = JSON.parse(data);
    return fixDeserializedGameObject(go);
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

  function addLight(position, color) {
    // create a point light
    var pointLight = new THREE.PointLight(color);

    // set its position
    pointLight.position = position;

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

  function mergeObjects(obj1, obj2) {
    if (obj1 === undefined || obj1 === null) return obj2;
    for (var k in obj2) {
      if (typeof(obj2[k]) == 'object') {
        obj1[k] = mergeObjects(obj1[k], obj2[k]);
      } else {
        obj1[k] = obj2[k];
      }
    }
    return obj1;
  }

  function clearWorld() {
    var body = world.GetBodyList();
    while (body) {
      world.DestroyBody(body);
      body = body.GetNext();
    }
  }

  function compareJSON(obj1, obj2) {
    if (obj1 === undefined) return obj2;
    var ret = {};
    for (var i in obj2) {
      if (obj2.hasOwnProperty(i)) {
        if (typeof(obj2[i]) == 'object') {
          ret[i] = compareJSON(obj1[i], obj2[i]);
        } else if (!obj1.hasOwnProperty(i) || obj2[i] !== obj1[i]) {
          ret[i] = obj2[i];
        }
        if (ret[i] === undefined) {
          delete ret[i];
        }
      }
    }
    if ($.isEmptyObject(ret)) {
      return undefined;
    }
    return ret;
  }

  function copyObject(obj) {
    return jQuery.extend(true, {}, obj);
  }