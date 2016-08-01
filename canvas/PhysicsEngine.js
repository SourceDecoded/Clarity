var RigidBody = require("./behaviors/RigidBody");
var Matter = require("matter-js");
var MultiKeyMap = require("../collections/MultiKeyMap");
var Composite = Matter.Composite;
var Engine = Matter.Engine;
var Events = Matter.Events;
var PhysicsEngine = (function () {
    function PhysicsEngine(rootView) {
        var _this = this;
        this.bodyToViewHash = {};
        this.collisionStartHandlers = new MultiKeyMap();
        this.collisionActiveHandlers = new MultiKeyMap();
        this.collisionEndHandlers = new MultiKeyMap();
        rootView.observe("addedChildMutation", function (event) {
            _this.addedChildMutation(event);
        });
        rootView.observe("removedChildMutation", function (event) {
            _this.removedChildMutation(event);
        });
        rootView.observe("addedBehavior", function (event) {
            _this.addedBehavior(event);
        });
        rootView.observe("removedBehavior", function (event) {
            _this.removedBehavior(event);
        });
        var renderer = {
            create: function () {
                return {
                    controller: renderer
                };
            },
            world: function (engine) {
            }
        };
        this.engine = Engine.create({
            render: {
                controller: renderer
            }
        });
        this.registerRigidBodies(rootView);
        Events.on(this.engine, 'collisionStart', function (event) {
            var pairs = event.pairs;
            for (var i = 0; i < pairs.length; i++) {
                var pair = pairs[i];
                _this.handleStartCollision(event, pair.bodyA, pair.bodyB);
            }
        });
        Events.on(this.engine, 'collisionActive', function (event) {
            var pairs = event.pairs;
            for (var i = 0; i < pairs.length; i++) {
                var pair = pairs[i];
                _this.handleActiveCollision(event, pair.bodyA, pair.bodyB);
            }
        });
        Events.on(this.engine, 'collisionEnd', function (event) {
            var pairs = event.pairs;
            for (var i = 0; i < pairs.length; i++) {
                var pair = pairs[i];
                _this.handleEndCollision(event, pair.bodyA, pair.bodyB);
            }
        });
    }
    PhysicsEngine.prototype.addedChildMutation = function (event) {
        this.registerRigidBodies(event.child);
    };
    PhysicsEngine.prototype.removedChildMutation = function (event) {
        this.unregisterRigidBodies(event.child);
    };
    PhysicsEngine.prototype.addedBehavior = function (event) {
        var behavior = event.behavior;
        if (behavior instanceof RigidBody) {
            this.addRigidBody(behavior, event.view);
        }
    };
    PhysicsEngine.prototype.removedBehavior = function (event) {
        var behavior = event.behavior;
        if (behavior instanceof RigidBody) {
            this.removeRigidBody(behavior, event.view);
        }
    };
    PhysicsEngine.prototype.addRigidBody = function (rigidBody, view) {
        var body = rigidBody.body;
        this.bodyToViewHash[body.id] = {
            view: view,
            rigidBody: rigidBody
        };
        Composite.add(this.engine.world, body);
    };
    PhysicsEngine.prototype.removeRigidBody = function (rigidBody, view) {
        delete this.bodyToViewHash[rigidBody.body.id];
        Composite.remove(this.engine.world, rigidBody.body, true);
    };
    PhysicsEngine.prototype.registerRigidBodies = function (view) {
        var _this = this;
        var rigidBody = view.getBehaviors(RigidBody)[0];
        if (rigidBody) {
            this.addRigidBody(rigidBody, view);
        }
        view.children.forEach(function (child) {
            _this.registerRigidBodies(child);
        });
    };
    PhysicsEngine.prototype.unregisterRigidBodies = function (view) {
        var _this = this;
        var rigidBody = view.getBehaviors(RigidBody)[0];
        if (rigidBody) {
            this.removeRigidBody(rigidBody.body, view);
        }
        view.children.forEach(function (child) {
            _this.unregisterRigidBodies(child);
        });
    };
    PhysicsEngine.prototype.handleStartCollision = function (event, bodyOne, bodyTwo) {
        var rigidBodyOne = this.bodyToViewHash[bodyOne.id].rigidBody;
        var rigidBodyTwo = this.bodyToViewHash[bodyTwo.id].rigidBody;
        var handler = this.collisionStartHandlers.get(rigidBodyOne.type, rigidBodyTwo.type);
        if (handler) {
            handler(event, rigidBodyOne, rigidBodyTwo);
        }
    };
    PhysicsEngine.prototype.handleActiveCollision = function (event, bodyOne, bodyTwo) {
        var rigidBodyOne = this.bodyToViewHash[bodyOne.id].rigidBody;
        var rigidBodyTwo = this.bodyToViewHash[bodyTwo.id].rigidBody;
        var handler = this.collisionActiveHandlers.get(rigidBodyOne.type, rigidBodyTwo.type);
        if (handler) {
            handler(event, rigidBodyOne, rigidBodyTwo);
        }
    };
    PhysicsEngine.prototype.handleEndCollision = function (event, bodyOne, bodyTwo) {
        var rigidBodyOne = this.bodyToViewHash[bodyOne.id].rigidBody;
        var rigidBodyTwo = this.bodyToViewHash[bodyTwo.id].rigidBody;
        var handler = this.collisionEndHandlers.get(rigidBodyOne.type, rigidBodyTwo.type);
        if (handler) {
            handler(event, rigidBodyOne, rigidBodyTwo);
        }
    };
    PhysicsEngine.prototype.update = function () {
        Engine.update(this.engine, 16);
    };
    PhysicsEngine.prototype.addCollisionStartHandler = function (first, second, handler) {
        this.collisionStartHandlers.add(first, second, handler);
        //Reverse function if the sequence is in reverse order.
        this.collisionStartHandlers.add(second, first, function (event, bodyOne, bodyTwo) {
            handler(event, bodyTwo, bodyOne);
        });
    };
    PhysicsEngine.prototype.removeCollisionStartHandler = function (first, second) {
        this.collisionStartHandlers.remove(first, second);
        this.collisionStartHandlers.remove(second, first);
    };
    PhysicsEngine.prototype.addCollisionActiveHandler = function (first, second, handler) {
        this.collisionActiveHandlers.add(first, second, handler);
        //Reverse function if the sequence is in reverse order.
        this.collisionActiveHandlers.add(second, first, function (event, bodyOne, bodyTwo) {
            handler(event, bodyTwo, bodyOne);
        });
    };
    PhysicsEngine.prototype.removeCollisionActiveHandler = function (first, second) {
        this.collisionActiveHandlers.remove(first, second);
        this.collisionActiveHandlers.remove(second, first);
    };
    PhysicsEngine.prototype.addCollisionEndHandler = function (first, second, handler) {
        this.collisionEndHandlers.add(first, second, handler);
        //Reverse function if the sequence is in reverse order.
        this.collisionEndHandlers.add(second, first, function (event, bodyOne, bodyTwo) {
            handler(event, bodyTwo, bodyOne);
        });
    };
    PhysicsEngine.prototype.removeCollisionEndHandler = function (first, second) {
        this.collisionEndHandlers.remove(first, second);
        this.collisionEndHandlers.remove(second, first);
    };
    return PhysicsEngine;
})();
module.exports = PhysicsEngine;
//# sourceMappingURL=PhysicsEngine.js.map