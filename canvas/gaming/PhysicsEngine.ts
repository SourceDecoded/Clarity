import View = require("../View");
import RigidBody = require("./RigidBody");
import Matter = require("matter-js");
import MultiKeyMap = require("../../collections/MultiKeyMap");

var Composite = Matter.Composite;
var Engine = <any>Matter.Engine;
var Events = Matter.Events;

class PhysicsEngine {
    private bodyToViewHash;
    private engine;
    private collisionStartHandlers: MultiKeyMap;
    private collisionActiveHandlers: MultiKeyMap;
    private collisionEndHandlers: MultiKeyMap;

    private addedChildMutation(event) {
        this.registerRigidBodies(event.child);
    }

    private removedChildMutation(event) {
        this.unregisterRigidBodies(event.child);
    }

    private addedBehavior(event) {
        var behavior = event.behavior;
        if (behavior instanceof RigidBody) {
            this.addRigidBody(behavior, event.view);
        }
    }

    private removedBehavior(event) {
        var behavior = event.behavior;
        if (behavior instanceof RigidBody) {
            this.removeRigidBody(behavior, event.view);
        }
    }

    private addRigidBody(rigidBody, view) {
        var body = rigidBody.body;
        this.bodyToViewHash[body.id] = {
            view: view,
            rigidBody: rigidBody
        };
        Composite.add(this.engine.world, body);
    }

    private removeRigidBody(rigidBody, view) {
        delete this.bodyToViewHash[rigidBody.body.id];
        Composite.remove(this.engine.world, rigidBody.body, true);
    }

    private registerRigidBodies(view: View) {
        var rigidBody = view.getBehaviors(RigidBody)[0];
        if (rigidBody) {
            this.addRigidBody(rigidBody, view);
        }

        view.children.forEach((child) => {
            this.registerRigidBodies(child);
        });
    }

    private unregisterRigidBodies(view: View) {
        var rigidBody = view.getBehaviors(RigidBody)[0];
        if (rigidBody) {
            this.removeRigidBody(rigidBody.body, view);
        }

        view.children.forEach((child) => {
            this.unregisterRigidBodies(child);
        });
    }

    private handleStartCollision(event, bodyOne, bodyTwo) {
        var rigidBodyOne = this.bodyToViewHash[bodyOne.id].rigidBody;
        var rigidBodyTwo = this.bodyToViewHash[bodyTwo.id].rigidBody;

        var handler = this.collisionStartHandlers.get(rigidBodyOne.type, rigidBodyTwo.type);

        if (handler) {
            handler(event, rigidBodyOne, rigidBodyTwo);
        }
    }

    private handleActiveCollision(event, bodyOne, bodyTwo) {
        var rigidBodyOne = this.bodyToViewHash[bodyOne.id].rigidBody;
        var rigidBodyTwo = this.bodyToViewHash[bodyTwo.id].rigidBody;

        var handler = this.collisionActiveHandlers.get(rigidBodyOne.type, rigidBodyTwo.type);

        if (handler) {
            handler(event, rigidBodyOne, rigidBodyTwo);
        }
    }

    private handleEndCollision(event, bodyOne, bodyTwo) {
        var rigidBodyOne = this.bodyToViewHash[bodyOne.id].rigidBody;
        var rigidBodyTwo = this.bodyToViewHash[bodyTwo.id].rigidBody;

        var handler = this.collisionEndHandlers.get(rigidBodyOne.type, rigidBodyTwo.type);

        if (handler) {
            handler(event, rigidBodyOne, rigidBodyTwo);
        }
    }

    constructor(rootView: View) {
        this.bodyToViewHash = {};
        this.collisionStartHandlers = new MultiKeyMap();
        this.collisionActiveHandlers = new MultiKeyMap();
        this.collisionEndHandlers = new MultiKeyMap();

        rootView.observe("addedChildMutation", (event) => {
            this.addedChildMutation(event);
        });
        rootView.observe("removedChildMutation", (event) => {
            this.removedChildMutation(event);
        });
        rootView.observe("addedBehavior", (event) => {
            this.addedBehavior(event);
        });
        rootView.observe("removedBehavior", (event) => {
            this.removedBehavior(event);
        });

        var renderer = {
            create: () => {
                return {
                    controller: renderer
                };
            },
            world: (engine) => {
            }
        };

        this.engine = Engine.create({
            render: {
                controller: renderer
            }
        });

        this.engine.enableSleeping = true;

        this.registerRigidBodies(rootView);

        Events.on(this.engine, 'collisionStart', (event) => {
            var pairs = event.pairs;
            for (var i = 0; i < pairs.length; i++) {
                var pair = pairs[i];
                this.handleStartCollision(event, pair.bodyA, pair.bodyB);
            }
        });

        Events.on(this.engine, 'collisionActive', (event) => {
            var pairs = event.pairs;

            for (var i = 0; i < pairs.length; i++) {
                var pair = pairs[i];
                this.handleActiveCollision(event, pair.bodyA, pair.bodyB);
            }
        });

        Events.on(this.engine, 'collisionEnd', (event) => {
            var pairs = event.pairs;
            for (var i = 0; i < pairs.length; i++) {
                var pair = pairs[i];
                this.handleEndCollision(event, pair.bodyA, pair.bodyB);
            }
        });
    }

    update() {
        Engine.update(this.engine, 16);
    }

    addCollisionStartHandler(first, second, handler) {
        this.collisionStartHandlers.add(first, second, handler);
        //Reverse function if the sequence is in reverse order.
        this.collisionStartHandlers.add(second, first, function (event, bodyOne, bodyTwo) {
            handler(event, bodyTwo, bodyOne);
        });
    }

    removeCollisionStartHandler(first, second) {
        this.collisionStartHandlers.remove(first, second);
        this.collisionStartHandlers.remove(second, first);
    }

    addCollisionActiveHandler(first, second, handler) {
        this.collisionActiveHandlers.add(first, second, handler);
        //Reverse function if the sequence is in reverse order.
        this.collisionActiveHandlers.add(second, first, function (event, bodyOne, bodyTwo) {
            handler(event, bodyTwo, bodyOne);
        });
    }

    removeCollisionActiveHandler(first, second) {
        this.collisionActiveHandlers.remove(first, second);
        this.collisionActiveHandlers.remove(second, first);
    }

    addCollisionEndHandler(first, second, handler) {
        this.collisionEndHandlers.add(first, second, handler);
        //Reverse function if the sequence is in reverse order.
        this.collisionEndHandlers.add(second, first, function (event, bodyOne, bodyTwo) {
            handler(event, bodyTwo, bodyOne);
        });
    }

    removeCollisionEndHandler(first, second) {
        this.collisionEndHandlers.remove(first, second);
        this.collisionEndHandlers.remove(second, first);
    }

}

export = PhysicsEngine;