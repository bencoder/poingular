var element = document.getElementById('pong');
var context = element.getContext('2d');

var Ball = function(x,y,angle,speed) {
    _this = this;
    this.update = function(dt) {
        x += Math.sin(angle) * speed * dt;
        y += Math.cos(angle) * speed * dt;
    }
    
    this.render = function(context) {
        context.beginPath();
        context.arc(x,y,5,0,2 * Math.PI, false);
        context.stroke();
    }
    
    this.distanceFrom = function(cX,cY) {
        return Math.sqrt(Math.pow(x-cX,2)+Math.pow(y-cY,2));
    }
    
    this.getAngleFrom = function(cX,cY) {
        return Math.atan2(y-cY,x-cX);
    }
    
    this.bounce = function(newAngle) {
        angle = newAngle;
    }
}

var Player = function(angle) {
    var angle = angle;
    var _this = this;
    var motion = 0;
    this.left = function() {
        motion = -1;
    }
    this.right = function() {
        motion = 1;
    }
    this.stop = function() {
        motion = 0;
    }
    this.update = function(dt) {
        angle += motion * dt;
    }
    this.render = function(context, size) {
        var radius = size/2-30;
        context.beginPath();
        context.arc(size/2,size/2,radius,angle-0.2,angle+0.2, false);
        context.stroke();
    }
    this.getAngle = function() {
        return angle;
    }
    this.hasHit = function(ballAngle) {
        var difference = angle - ballAngle;
        while (difference > Math.PI) {
            difference -= Math.PI*2;
        }
        while (difference < -Math.PI) {
            difference += Math.PI*2;
        }
        if (Math.abs(difference) <= 0.2) {
            return difference;
        } else {
            return false;
        }
    }
}

var Game = function(context, size, playerCount) {
    var radius = size/2 - 10;
    var players = new Array(playerCount);
    var anglePerPlayer = Math.PI*2 / playerCount;
    var ball = new Ball(size/2,size/2,0,200);
    for (var i=0;i<playerCount;i++) {
        players[i] = new Player(anglePerPlayer*i);
    }
    this.render = function() {
        context.clearRect(0,0,size,size);
        context.beginPath();
        context.arc(size/2,size/2,radius,0,2 * Math.PI, false);
        context.stroke();
        for(var i=0;i<players.length;i++) {
            players[i].render(context, size);
        }
        ball.render(context);
    }
    var keyCodes = [
        [65,83],
        [75,76],
        [86,66]
    ];
    
    this.update = function(dt) {
        ball.update(dt);
        var angle;
        var ballDistance = ball.distanceFrom(size/2,size/2);
        if (ballDistance >= size/2-30 && ballDistance <=size/2-20) {
            angle = ball.getAngleFrom(size/2,size/2);
        } else if (ballDistance >= size/2-10) {
            ball = new Ball(size/2,size/2,0,200);
        }
        for (var i=0;i<players.length;i++) {
            players[i].update(dt);
            if (angle != undefined) {
                var bounceDistance = players[i].hasHit(angle);
                if (bounceDistance !== false) {
                    var bounceAngle = -players[i].getAngle()-Math.PI/2-Math.PI/4*bounceDistance/0.2;
                    ball.bounce(bounceAngle);
                };
            }
        }    
    }
    this.keyDown = function(keyCode) {
        for(var i=0;i<keyCodes.length && i<players.length;i++) {
            var direction = keyCodes[i].indexOf(keyCode);
            if (direction != -1) {
                switch(direction) {
                    case 0:
                        players[i].left();
                        break;
                    case 1:
                        players[i].right();
                        break;
                }
            }
        }
    }
    this.keyUp = function(keyCode) {
        for(var i=0;i<keyCodes.length && i<players.length;i++) {
            if (keyCodes[i].indexOf(keyCode) != -1) {
                players[i].stop();
            }
        }
    }
}

var game = new Game(context, 600,2);

var lastTime;

var loop = function(now) {
    if(!lastTime){lastTime=now;}
    var dt=(now - lastTime)/1000;
    lastTime = now;
    window.requestAnimationFrame(loop);
    game.update(dt);
    game.render();
}

window.requestAnimationFrame(loop);

window.addEventListener('keydown', function(event) {
    game.keyDown(event.keyCode);
})

window.addEventListener('keyup', function(event) {
    game.keyUp(event.keyCode);
})