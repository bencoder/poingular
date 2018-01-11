let element = document.getElementById('pong');
let context = element.getContext('2d');

let connection = new WebSocket('ws://'+window.location.hostname+':8082');

let Ball = function(x,y,angle,speed) {
    let _this = this;

    this.update = function(dt) {
        x += Math.sin(angle) * speed * dt;
        y += Math.cos(angle) * speed * dt;
    };
    
    this.render = function(context) {
        context.beginPath();
        context.arc(x,y,5,0,2 * Math.PI, false);
        context.stroke();
        context.fill();
    };
    
    this.distanceFrom = function(cX,cY) {
        return Math.sqrt(Math.pow(x-cX,2)+Math.pow(y-cY,2));
    };
    
    this.getAngleFrom = function(cX,cY) {
        return Math.atan2(y-cY,x-cX);
    };
    
    this.bounce = function(newAngle) {
        angle = newAngle;
    };

    this.set = function(sx, sy, sangle, sspeed) {
      x = sx;
      y = sy;
      angle = sangle;
      speed = sspeed;
    }

    this.get = function() {
      return [x, y, angle, speed]
    }
};

let numEnemies = 0

let Player = function(angle) {
    let _this = this;
    let motion = 0;

    this.left = function() {
        motion = -1;
    };
    this.right = function() {
        motion = 1;
    };
    this.stop = function() {
        motion = 0;
    };
    let previousAngle = angle;
    this.update = function(dt) {
        angle += motion * dt;
        if (previousAngle != angle) {
          previousAngle = angle;
          return true;
        }
        return false;
    };
    this.render = function(context, size) {
        const width = 0.2 * Math.pow(0.9, numEnemies)
        let radius = size/2-30;
        context.beginPath();
        context.arc(size/2,size/2,radius,angle-width,angle+width, false);
        context.stroke();
    };
    this.getAngle = function() {
        return angle;
    };
    this.setAngle = function(sangle) {
      angle = sangle;
    }
    this.hasHit = function(ballAngle) {
        const width = 0.2 * Math.pow(0.9, numEnemies)
        let difference = angle - ballAngle;
        while (difference > Math.PI) {
            difference -= Math.PI*2;
        }
        while (difference < -Math.PI) {
            difference += Math.PI*2;
        }
        if (Math.abs(difference) <= width) {
            return difference;
        } else {
            return false;
        }
    }
};

let Game = function(context, size, playerName) {
    let radius = size/2 - 10;
    let player = new Player(Math.random()*Math.PI*2);
    let score = 0;
    let lastHit = false;

    let enemies = {};

    let ball = new Ball(size/2,size/2,0,200);
    connection.onmessage = function (e) {
      const data = JSON.parse(e.data);
      switch(data.type) {
        case 'player':
          if (!enemies[data.name]) {
            enemies[data.name] = {
              player: new Player(data.angle),
              score: data.score,
              time: (+ new Date())
            };
            numEnemies++;
          } else {
            enemies[data.name].player.setAngle(data.angle);
            enemies[data.name].score = data.score;
            enemies[data.name].time = (+ new Date());
          }
          break;

        case 'ball':
          ball.set.apply(null, data.params)
          lastHit = false
          break;
      }
    };

    const sendPlayer = () => {
      connection.send(JSON.stringify({
        type: 'player',
        name: playerName,
        angle: player.getAngle(),
        score
      }));
    }

    setInterval(sendPlayer, 1000)

    this.render = function() {
        context.clearRect(0,0,size+400,size);
        context.lineWidth = 1;
        context.strokeStyle = '#000';
        context.beginPath();
        context.arc(size/2,size/2,radius,0,2 * Math.PI, false);
        context.stroke();
        context.lineWidth = 5;
        context.strokeStyle = "#F00";
        for(const key in enemies) {
          enemies[key].player.render(context, size);
        }
        context.strokeStyle = "#0F0";
        player.render(context, size);
        context.strokeStyle = "#000";
        context.lineWidth = 1;
        ball.render(context);
        let top = 50;
        context.font = "30px Arial";
        context.fillText('Score: '+score,size+100,top);
        top += 50;
        context.font = "12px Arial";
        for(const enemyName in enemies) {
          context.fillText(enemyName,size+100,top);
          context.fillText(enemies[enemyName].score,size+300,top);
          top += 20
        }
    };

    let keyCodes = [37,39];
    
    this.update = function(dt) {
        ball.update(dt);
        let angle;
        let ballDistance = ball.distanceFrom(size/2,size/2);
        if (ballDistance >= size/2-30 && ballDistance <=size/2-20) {
            angle = ball.getAngleFrom(size/2,size/2);
        } else if (ballDistance >= size/2) {
            if (lastHit) {
              score++;
            }
            ball = new Ball(size/2,size/2,0,200);
            lastHit = false;
        }

        if (player.update(dt)) {
          sendPlayer()
        }

        if (angle != undefined) {
            let bounceDistance = player.hasHit(angle);
            if (bounceDistance !== false) {
                let bounceAngle = -player.getAngle()-Math.PI/2-Math.PI/4*bounceDistance/0.2;
                ball.bounce(bounceAngle);
                lastHit = true;
                connection.send(JSON.stringify({
                  type: 'ball',
                  params: ball.get()
                }));
            }
        }
      for(const key in enemies) {
        if ((+ new Date()) > enemies[key].time + 1500) {
          delete enemies[key]
          numEnemies--;
        }
      }
    };

    this.keyDown = function(keyCode) {
        let direction = keyCodes.indexOf(keyCode);
        if (direction != -1) {
            switch(direction) {
                case 0:
                    player.left();
                    break;
                case 1:
                    player.right();
                    break;
            }
        }
    };

    this.keyUp = function(keyCode) {
        if (keyCodes.indexOf(keyCode) != -1) {
            player.stop();
        }
    }
};

let name = null;
while (!name) {
  name = prompt('Enter your name');
}

let game = new Game(context, 600, name+'_'+Math.floor(Math.random()*900+100));

let lastTime;

let loop = function(now) {
    if(!lastTime){lastTime=now;}
    let dt=(now - lastTime)/1000;
    lastTime = now;
    window.requestAnimationFrame(loop);
    game.update(dt);
    game.render();
};

window.requestAnimationFrame(loop);

window.addEventListener('keydown', function(event) {
    game.keyDown(event.keyCode);
});

window.addEventListener('keyup', function(event) {
    game.keyUp(event.keyCode);
});