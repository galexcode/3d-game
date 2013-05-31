  // Game Definitions

  var scene, camera, renderer;
  var player;
  var input = new InputManager();
  var cameraOffset = new THREE.Vector3(0, 40, 25);
  var gameObjects = [];
  var testSerialization;
  var modelData = [];
  var prototypes = {};
  var cells;

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
    initCells();
    onWindowResize();

    // scene = new THREE.Scene();
    // loadGameObject("android");
    // loadGameObject("interior");    
    //addLight(new THREE.Vector3(10, 50, 130), new THREE.Color('#ffffff'));
    loadScene("testScene", function() {
      loadGrid();
    });

    document.body.appendChild(renderer.domElement);
    //$("#dialog").dialog();
  }

  function loadGrid() {
    var height = 0.1;
    var geometry = new THREE.Geometry();
    for (var x = -1000; x < 1000; x += 10) {
      geometry.vertices.push(new THREE.Vector3(x, height, -1000));
      geometry.vertices.push(new THREE.Vector3(x, height, 1000));
    }
    for (var z = -1000; z < 1000; z += 10) {
      geometry.vertices.push(new THREE.Vector3(-1000, height, z));
      geometry.vertices.push(new THREE.Vector3(1000, height, z));
    }
    var material = new THREE.LineBasicMaterial();
    var grid = new THREE.Line(geometry, material, THREE.LinePieces);
    scene.add(grid);
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
    renderer = new THREE.WebGLRenderer({
      antialias: true
    });
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
  }

  function update() {
    updateInput();
    TWEEN.update();
    if (player) {
      updatePlayer();
    }
    updatePhysics();
    input.update();
    if (player) {
      updateCamera();
    }
  }

  function updateInput() {
    if (input.isKeyTriggered(VK_P)) {
      saveScene();
    }
    if (input.isKeyTriggered(VK_E)) {
      interact();
    } else if (input.isKeyReleased(VK_E)) {
      player.grabbedObject = undefined;
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
    if (player && !player.busy) {
      if (input.isKeyDown(VK_LEFT)) {
        rotateObject(player.grabbedObject, -Math.PI / 2);
      } else if (input.isKeyDown(VK_RIGHT)) {
        rotateObject(player.grabbedObject, Math.PI / 2);
      } else if (input.isKeyDown(VK_UP)) {
        pushObject(player.grabbedObject, 1);
      } else if (input.isKeyDown(VK_DOWN)) {
        pushObject(player.grabbedObject, -1);
      }
    }
  }

  function updatePlayer() {
    if (player.busy || player.grabbedObject)
      return;
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
        go.transform.position.x = go.model.position.x = position.x;
        go.transform.position.z = go.model.position.z = position.y;
        go.model.rotation.y = 2 * Math.PI - object.GetAngle() + (go.rotOffset ? go.rotOffset : 0);

      }
      object = object.GetNext();
    }
    world.DrawDebugData();
    world.ClearForces();
  }

  function interact() {
    var cell = getFacingCell();
    if (cell.objects.length > 0 && cell.objects[0] != player) {
      player.grabbedObject = cell.objects[0];
    }
  }

  function saveScene() {
    saveData(serializeScene());
  }

  function serializeScene() {
    var output = {};
    output.lights = [];
    output.prototypes = [];
    var i;
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
    if (go.bodyDef) {
      go.bodyDef.userData = undefined;
    }
    return {
      parent: go.parent,
      transform: go.transform,
      bodyDef: go.bodyDef,
      fixDef: go.fixDef,
      modelName: go.modelName,
      light: go.light,
      isPlayer: go.isPlayer,
      rotOffset: go.rotOffset
    };
  }

  function serializeFixGameObject(go) {
    if (go.bodyDef) {
      go.bodyDef.userData = go;
    }
  }

  function deserializeScene(data) {
    scene = new THREE.Scene();
    clearWorld();
    gameObjects = [];
    var input = typeof(data) == 'object' ? data : JSON.parse(data);
    for (var i = 0; i < input.prototypes.length; i++) {
      var proto = input.prototypes[i];
      var go = loadGameObject(proto.parent, proto);
    }
  }

  function loadScene(name, callback) {
    $.getJSON("res/scenes/" + name + ".js", function(data) {
      deserializeScene(data);
      if (callback !== undefined)
        callback();
    });
  }

  function fixDeserializedGameObject(go) {
    if (!go.transform) {
      go.transform = {
        position: new THREE.Vector3()
      };
    }
    if (go.bodyDef) {
      go.bodyDef.userData = go;
      go.body = world.CreateBody(go.bodyDef);
      go.body.SetPosition(new b2Vec2(go.transform.position.x, go.transform.position.z));
      if (go.fixDef) {
        var fixDef = new b2FixtureDef();
        fixDef.shape = go.fixDef.shape.m_type === 0 ? new b2CircleShape() : new b2PolygonShape();
        go.fixDef = mergeObjects(fixDef, go.fixDef);
        go.body.CreateFixture(go.fixDef);
      }
    }
    if (go.modelName) {
      loadModel(go.modelName, function(md) {
        go.model = addModel(md.geometry, md.materials);
      });
    }
    if (go.light) {
      addLight(go.transform.position, go.light.color);
    }
    if (go.isPlayer) player = go;
    gameObjects.push(go);
    posToCell(go.transform.position.x, go.transform.position.z).objects.push(go);
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

  function addLight(position, color) {
    // create a point light
    var pointLight = new THREE.PointLight(color);

    // set its position
    pointLight.position = position;

    // add to the scene
    scene.add(pointLight);
    return pointLight;
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

  function Cell() {
    this.objects = [];
  }

  function initCells() {
    cells = new Array(100);
    for (var i = 0; i < 100; i++) {
      cells[i] = new Array(100);
    }
    for (var x = 0; x < cells.length; x++) {
      for (var y = 0; y < cells.length; y++) {
        cells[x][y] = new Cell();
        cells[x][y].x = x;
        cells[x][y].y = y;
      }
    }
  }

  function posToCell(posX, posY) {
    var cellX = Math.floor(posX / 10);
    var cellY = Math.floor(posY / 10);
    return cells[cellX][cellY];
  }

  function getObjectCell(go) {
    return posToCell(go.transform.position.x, go.transform.position.z);
  }

  function getFacingCell() {
    var x = player.transform.position.x;
    var y = player.transform.position.z;
    var a = player.body.GetAngle();
    x += Math.cos(a) * 5.5;
    y += Math.sin(a) * 5.5;
    return posToCell(x, y);
  }

  function rotateObject(go, angle) {
    if (!go) return;
    var newAngle = go.body.GetAngle() + angle;
    player.busy = true;
    var tween = new TWEEN.Tween({
      angle: go.body.GetAngle()
    }).to({
      angle: newAngle
    }, 200).onUpdate(function() {
      go.body.SetAngle(this.angle);
    }).onComplete(function() {
      player.busy = false;
    }).start();
  }

  function pushObject(go, cellOffset) {
    if (!go) return;
    var playerCell = getObjectCell(player);
    var goCell = getObjectCell(go);
    var dx = (goCell.x - playerCell.x) * cellOffset;
    var dy = (goCell.y - playerCell.y) * cellOffset;
    pushObjectHelper(go, goCell, dx, dy);
    pushObjectHelper(player, playerCell, dx, dy);
  }

  function pushObjectHelper(go, goCell, dx, dy) {
    var cellX = goCell.x + dx;
    var cellY = goCell.y + dy;
    var newPos = cellToPos(cellX, cellY);
    var newCell = cells[cellX][cellY];
    changeObjectCell(go, newCell, goCell);
    player.busy = true;
    var tween = new TWEEN.Tween(go.body.GetPosition())
      .to(newPos, 200).onUpdate(function() {
      go.body.SetPosition(new b2Vec2(this.x, this.y));
    }).onComplete(function() {
      player.busy = false;
    }).start();
  }

  function cellToPos(cellX, cellY) {
    return {
      x: cellX * 10 + 5,
      y: cellY * 10 + 5
    };
  }

  function changeObjectCell(go, dest, src) {
    removeFromArray(go, src.objects);
    dest.objects.push(go);
  }

  function removeFromArray(o, arr) {
    for (var i = 0; i < arr.length; i++) {
      if (arr[i] === o) {
        arr.splice(i, 1);
        return;
      }
    }
  }