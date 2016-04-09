window.GAME = window.GAME || {};

GAME.start = function () {

	var vpW = window.innerWidth, vpH = window.innerHeight;
    var time = 0.0;
    var W = 100, H = (vpH/vpW)*100;

    var canvas = document.createElement('canvas');
    canvas.width = vpW; canvas.height = vpH;
    canvas.oncontextmenu = function(){ return false; };
    var ctx = canvas.getContext('2d');
    document.body.appendChild(canvas);

    var KEY = {};
    var LKEY = {};

    document.body.onkeydown = function(e) {
    	KEY[e.which || e.keycode] = true;
    };

    document.body.onkeyup = function(e) {
    	KEY[e.which || e.keycode] = false;
    };

    window.addEventListener("resize", function(){
        vpW = window.innerWidth;
        vpH = window.innerHeight;

        canvas.width = vpW;
        canvas.height = vpH;
        canvas.style.width = '100%';
        canvas.style.height = '100%';

        W = 100;
        H = (vpH / vpW) * 100;
    });

    var ford = [
        document.getElementById('fh1'),
        document.getElementById('fh2')
    ];

    var PX = function(x) {
        return (x / W) * vpW;
    };

    var PY = function(y) {
        return (y / H) * vpH - 200;
    };

    var TD = function(x, S) {
        var diff = 1 + Math.max(x-400) / 3600.0;
        var d = 0.0;
        Math.seedrandom(~~(x/64)+seed); d += Math.pow(Math.random(), 1/diff)*0.5;
        Math.seedrandom(~~(x/32)+seed); d += Math.pow(Math.random(), 1/diff)*0.25;
        Math.seedrandom(~~(x/8)+seed); d += Math.pow(Math.random(), 1/diff)*0.125;
        Math.seedrandom(~~(x/4)+seed); d += Math.pow(Math.random(), 1/diff)*0.125/2;
        if (x<100) {
            d = 0.0;
        }
        if (S) {
            return (Math.sin(d*diff*7) * 0.5 + 0.5) * H * 0.5;
        }
        else {
            return Math.pow(d,1/3) * 0.8 * H * 0.45;
        }
    };

    var dist = 0;
    var speed = 3;
    var dead = true;
    var seed = Math.random() * 1000000;
    var deadtime = -1000;
    var FY = H/2;
    var FX = W/2;
    var FYV = 0;

    var lastTime = new Date().getTime();

	var frameCbk = function () {

        var newTime = new Date().getTime();
        var dt = newTime - lastTime;
        if (dt > 1/10) {
            dt = 1/10;
        }

        dt *= 0.25;

        lastTime = newTime;
        time += dt;

        if (!dead) {
            dist += 1.0 / 10.0 * speed * (dt/(1/60));
            speed += 1.0/600.0  * (dt/(1/60));
        }

        FYV += 0.05 * (dt/(1/60));
        if (KEY[32] && !dead && !(dead && (time-deadtime)>1)) {
            FYV -= 0.1 * (dt/(1/60));
        }
        if (!dead || (time-deadtime)<1) {
            FY += FYV  * (dt/(1/60));
        }

        var grad = ctx.createLinearGradient(0,0,0,vpH);
        grad.addColorStop(0,"#8ff");
        grad.addColorStop(1,"#48f");

        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, PX(W), PY(1000));

        var lst = [];
        for (var x=-64; x<=W+64; x+=8) {
            var x2 = x + dist;
            x2 = (~~(x2/8)) * 8;
            lst.push([x-(dist-(~~(dist/8))*8), TD(x2), TD(x2+400, true)]);
        }

        var top = [];
        var bot = [];

        var grad = ctx.createLinearGradient(0,0,vpW,vpH);
        grad.addColorStop(0,"#888");
        grad.addColorStop(1,"white");

        ctx.beginPath();
        ctx.moveTo(-1000, -1000);
        for (var i=0; i<lst.length; i++) {
            var x, y;
            x=PX(lst[i][0]); y=PY(lst[i][1]+lst[i][2]);
            top.push([x,y]);
        }
        for (var i=1; i<top.length; i++) {
            var k = top[i-1];
            var v = top[i];
            //k = [ (k[0]+v[0]) * 0.5, (k[1]+v[1])*0.5];
            if (i<4 || i>=(top.length-5)) {
                ctx.lineTo(k[0], k[1]);
            }
            else {
                ctx.arcTo(k[0], k[1], v[0], v[1], vpW/20);
            }
        }
        ctx.lineTo(PX(W), -1000);
        ctx.lineTo(-1000, -1000);
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(-1000, PY(1000));
        for (var i=0; i<lst.length; i++) {
            var x, y;
            x=PX(lst[i][0]); y=PY(H-lst[i][1]+lst[i][2]);
            bot.push([x,y]);
        }
        for (var i=1; i<bot.length; i++) {
            var k = bot[i-1];
            var v = bot[i];
            //k = [ (k[0]+v[0]) * 0.5, (k[1]+v[1])*0.5];
            if (i<4 || i>=(bot.length-5)) {
                ctx.lineTo(k[0], k[1]);
            }
            else {
                ctx.arcTo(k[0], k[1], v[0], v[1], vpW/20);
            }
        }
        ctx.lineTo(PX(W), PY(1000));
        ctx.lineTo(-1000, PY(1000));
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();

        var pfx = PX(FX), pfy = PY(FY) + 200;
        for (var i=1; !dead && i<top.length && i<bot.length; i++) {
            if (pfx > top[i-1][0] && pfx <= top[i][0]) {
                var t = (pfx - top[i-1][0]) / (top[i][0] - top[i-1][0]);
                var y1 = top[i-1][1] + t * (top[i][1] - top[i-1][1]);
                var y2 = bot[i-1][1] + t * (bot[i][1] - bot[i-1][1]);
                if (pfy > y2 || pfy < y1) {
                    dead = true;
                    deadtime = time;
                    FYV = -1;
                }
                break;
            }
        }

        var anim = 0;
        if (KEY[32] && !dead) {
            anim = Math.sin(time * 120) > 0 ? 1 : 0;
        }
        var fw = ford[anim].width;
        var fh = ford[anim].height;
        var sc = 1;
        if (dead) {
            var t = time - deadtime;
            if (t>1) {
                t = 1;
            }
            sc *= Math.pow(t+1, 3.0);
            ctx.globalAlpha = 1.0 / Math.pow(sc, 0.25);
        }
        ctx.drawImage(ford[anim], 0, 0, fw, fh, PX(FX-fw/32*0.5*sc), PY(FY-fh/32*0.5*sc) + 200, PX(fw/32*sc), PY(fh/32*sc) + 200);
        ctx.globalAlpha = 1.0;

		window.requestAnimationFrame(frameCbk);

        for (var key in KEY) {
            LKEY[key] = KEY[key];
        }

        ctx.lineWidth = 4;

        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'black';
        ctx.font = "30px Sans-Serif";
        ctx.textAlign = 'left';
        if (dist > 0) {
            ctx.strokeText(~~(dist) + ' m',10,10+30);
            ctx.fillText(~~(dist) + ' m',10,10+30);
        }

        if (dead && (time-deadtime) > 1) {
            ctx.fillStyle = '#ffff00';
            ctx.font = "90px Sans-Serif";
            ctx.textAlign = 'center';
            ctx.strokeText('[Enter] For "All You Can Fly"',vpW/2,vpH/2+45);
            ctx.fillText('[Enter] For "All You Can Fly"',vpW/2,vpH/2+45);
            if (KEY[13]) {
                dist = 0;
                speed = 3;
                dead = false;
                seed = Math.random() * 1000000;
                deadtime = -1000;
                FY = H/2;
                FX = W/2;
                FYV = 0;                
            }
        }

        ctx.lineWidth = 1;
	};
	window.requestAnimationFrame(frameCbk);

};
