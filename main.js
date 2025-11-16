var can = document.querySelector("canvas");
var paint = can.getContext("2d", { willReadFreuently: true });
const pi = Math.PI;
paint.translate(0, can.height);
paint.scale(1, -1);
console.log("Demarrage");

paint.translate(can.width / 2, can.height / 2);
let decalage = 1000; // distance d'un object après l'écran avant d'être effacé
const movePx = 10;
// ---Classes---

/**
 * Pour les couleurs des surfaces decoupés, pour mieux gérer les couleurs par petite surfaces, au cas ou ca doit differer
 */
class ColTab {
    /**
     *
     * @param {number} num Nombre de fois successifs que cette couleur va s'appliquer
     * @param {string[]} color Les deux couleurs proprement dites
     */
    constructor(num, color = ["dodgerblue", "pink"]) {
        this.num = num;
        this.color = color;
    }
}

function newColTab(num = 0, color = ["dodgerblue", "pink"]) {
    return new ColTab(num, color);
}
/**
 * Classe du point
 */
class Point {
    constructor(x = 0, y = 0, z = 0) {
        /**
         * cordonnée
         */
        this.x = x;
        /**
         * cordonnée
         */
        this.y = y;
        /**
         * cordonnée
         */
        this.z = z;
    }

    toString() {
        return "Point (" + this.x + ", " + this.y + ", " + this.z + ")";
    }
}

class Line {
    /**
     *
     * @param {Point} a - un point de la droite
     * @param {Vector} u - un vecteur directeur de la droite
     */
    constructor(a = newPoint(), u = newVect()) {
        /**
         * Un point de la droite
         */
        this.a = a;
        /**
         * vecteur directeur
         */
        this.u = u;
    }
    /**
     *
     * @param {Point} m - Point inconnu
     * @returns {Boolean} - true si le point est sur la droite et false si le point ne l'est pas
     */
    contains(m = newPoint()) {
        return vectProd(this.u, pointsToVect(this.a, m)).norm == 0;
    }
}

// Surface a utiliser pour diviser d'autres surfaces, celle-ci n'est pas à dessiner
class MathSurface {
    constructor(a = newPoint(), vect = newVect()) {
        this.a = a;
        this.vect = vect;
    }
    divideSurface(surface = new Surface()) {
        let upPoints = [];
        let downPoints = [];
        if (!surface.initialised) surface.getAllPoints();
        let points = surface.points;
        let oldUp = false,
            oldDown = false;

        // taking up points and down points
        for (const point of points.concat([points[0]])) {
            let ab = pointsToVect(this.a, point);
            let p = vectScal(ab, this.vect);
            if (p > 0) {
                if (oldDown) {
                    upPoints.push(vectTrans(this.a, vectSub(ab, this.vect.normed(p))));
                    downPoints.push(vectTrans(this.a, vectSub(ab, this.vect.normed(p))));
                }
                upPoints.push(point);
                oldUp = true;
                oldDown = false;
            } else if (p < 0) {
                if (oldUp) {
                    upPoints.push(vectTrans(this.a, vectSub(ab, this.vect.normed(p))));
                    downPoints.push(vectTrans(this.a, vectSub(ab, this.vect.normed(p))));
                }
                downPoints.push(point);
                oldUp = false;
                oldDown = true;
            }
        }
        let upSurfacesPoints = [];
        let downSurfacesPoints = [];
        let current = [];
        for (const point of upPoints) {
            current.push(point);
            if (points.indexOf(point) == -1) {
                // this point is an intersection point
                if (current.length > 1) {
                    upSurfacesPoints.push(current);
                    current = [];
                }
            }
        }
        upSurfacesPoints.push(current);
        current = [];
        for (const point of downPoints) {
            current.push(point);
            if (points.indexOf(point) == -1) {
                // this point is an intersection point
                if (current.length > 1) {
                    downSurfacesPoints.push(current);
                    current = [];
                }
            }
        }
        downSurfacesPoints.push(current);
        if (upSurfacesPoints[upSurfacesPoints.length - 1].length == 0) {
            upSurfacesPoints.pop();
        }

        if (downSurfacesPoints[downSurfacesPoints.length - 1].length == 0) {
            downSurfacesPoints.pop();
        }
        if (upSurfacesPoints.length > 1) {
            upSurfacesPoints[0] = upSurfacesPoints[0].concat(upSurfacesPoints[upSurfacesPoints.length - 1]);
            let lastSp = upSurfacesPoints.pop();
            if (lastSp.length > 1) upSurfacesPoints[0].pop();
        }
        // if (downSurfacesPoints.length > 1) {
        //     downSurfacesPoints[0] = downSurfacesPoints[0].concat(downSurfacesPoints[downSurfacesPoints.length - 1]);
        //     let lastSp = downSurfacesPoints.pop();
        //     console.log(lastSp);

        //     if (lastSp.length > 1) downSurfacesPoints[0].pop();
        // }
        let treatedSpoints = [];
        let realsSurfacesPoints = [];
        for (let i = 0; i < upSurfacesPoints.length; i++) {
            var sPoints = upSurfacesPoints[i];
            if (sPoints.length == 0 || treatedSpoints.includes(i)) continue;
            let a = sPoints[0],
                b = sPoints[sPoints.length - 1];
            for (let j = i + 1; j < upSurfacesPoints.length; j++) {
                const sPoint2 = upSurfacesPoints[j];
                if (treatedSpoints.includes(j) || sPoint2.length == 0) continue;
                if (vectScal(pointsToVect(a, sPoint2[0]), pointsToVect(b, sPoint2[0])) < 0) {
                    if (i == 0) {
                        let lastP = sPoints.pop();
                        sPoints = sPoints.concat(sPoint2);
                        sPoints.push(lastP);
                    } else sPoints = sPoints.concat(sPoint2);
                    treatedSpoints.push(i, j);
                    break;
                }
            }
            realsSurfacesPoints.push(sPoints);
            treatedSpoints.push(i);
        }
        treatedSpoints = [];
        for (let i = downSurfacesPoints.length - 1; i >= 0; i--) {
            var sPoints = downSurfacesPoints[i];
            if (sPoints.length == 0 || treatedSpoints.includes(i)) continue;
            let a = sPoints[0],
                b = sPoints[sPoints.length - 1];
            let ab = pointsToVect(a, b);
            for (let j = i - 1; j >= 0; j--) {
                const sPoint2 = downSurfacesPoints[j];
                if (treatedSpoints.includes(j) || sPoint2.length == 0) continue;
                if (vectScal(pointsToVect(a, sPoint2[0]), pointsToVect(b, sPoint2[0])) < 0) {
                    sPoints = sPoints.concat(sPoint2);
                    treatedSpoints.push(i, j);
                    break;
                }
            }
            realsSurfacesPoints.push(sPoints);
            treatedSpoints.push(i);
        }
        return realsSurfacesPoints;
    }
}

/**
 * Objet vecteur
 */
class Vector extends Point {
    constructor(x = 0, y = 0, z = 0) {
        super(x, y, z);
    }

    toString() {
        return " Vecteur (" + intTronc(this.x) + ", " + intTronc(this.y) + ", " + intTronc(this.z) + ")";
    }
    /**
     * Ceci est la norme du vecteur
     */
    get norm() {
        let norm = 0;
        norm = this.x ** 2 + this.y ** 2 + this.z ** 2;
        return Math.sqrt(norm);
    }
    /**
     * Vecteur unitaire
     */
    get unit() {
        if (this.norm == 0) {
            return newVect(0, 0, 0);
        } else {
            return newVect(this.x / this.norm, this.y / this.norm, this.z / this.norm);
        }
    }

    /**
     *  Vecteur contraire (-u)
     */
    get inverse() {
        return new Vector(-this.x, -this.y, -this.z);
    }
    /**
     * Les coordonnées du vecteurs dans un tableau[3]
     */
    get coords() {
        return [this.x, this.y, this.z];
    }
    /**
     * Retournes un vecteur avec la même direction mais avec une norme multipliée
     * @param {number} len - Nouvelle norme du vecteur
     * @returns le vecteur
     */
    normed(len = 0) {
        return newVect(this.x * len, this.y * len, this.z * len);
    }
    newLen(len = 0) {
        return this.unit.normed(len);
    }
}

class Surface {
    constructor() {
        this.type = "surface";
        this.color = ["blue", "red"];
        this.vectors = [];
        this.stroke = "black";
        this.initialised = false;
        this.points = [newPoint()];
    }
    cent() {
        if (this.center == undefined) return false;
        return this.center;
    }
    get distance() {
        return pointsToVect(camPos.p, this.cent()).norm;
    }
    /**
     * Cette fonction dessine la surface
     */
    draw() {
        if (this.distance + decalage < camPos.screen && Math.abs(vectScal(camPos.direction, this.vect.unit)) > Math.cos(pi / 1000)) {
            return;
        }
        if (
            vectScal(pointsToVect(camPos.p, this.cent()), this.vect) == 0 ||
            this.distance > 5000 ||
            (vectScal(pointsToVect(camPos.p, this.a), camPos.direction) < 0 && this.a != undefined)
        ) {
            return;
        }
        /*
        Principe:
            si le premier point est avant l'ecran, on travaille puis on projecte
        */
        let started = false; // Pour voir si au moins 1 point est avant l'écran
        let outScreen = false; // Pour voir si le point precedent était après l'écran
        let firstOutPoint = newPoint(); // le point precedant le premier point dans l'ecran
        let firstInScreen = newPoint(); // Premier point dans l'ecran
        let p = newPoint();
        let firstOutScreen = false; // Pour voir si le premier point est avant ecran
        let lastInScreenPoint = newPoint();
        let lastOutScreenPoint = newPoint();
        paint.beginPath();
        if (!this.initialised || this instanceof InfiniteFlatSurface) this.getAllPoints();
        for (const point of this.points) {
            if (vectScal(camPos.direction.unit, pointsToVect(camPos.p, point)) < camPos.screen - decalage) {
                outScreen = true;
                lastOutScreenPoint = point;
                if (!started) {
                    // Ici, le premier point est après l'écran
                    firstOutPoint = point;
                    firstOutScreen = true;
                    continue;
                }
                if (started) {
                    // Pour voir si on est entrain de continuer avec des points apres ecran (qui ne comptent pas d'être dessiné)
                    if (point == firstOutPoint) continue;
                    let vectCrossScreen = pointsToVect(lastInScreenPoint, point); // Vecteur reliant le point devant au point derriere l'ecran
                    // Ici, nous calulons d'abord la norme du vecteur vectCrossScreen quittant du point dans l'ecran vers le point d'intersection
                    let distToScreen = vectScal(camPos.direction.unit, pointsToVect(camPos.p, lastInScreenPoint)) - camPos.screen + decalage; // Distance du dernier point devant l'écran à l'écran
                    let distVectCross = distToScreen / Math.abs(vectScal(camPos.direction.unit, vectCrossScreen.unit)); // Nous obtenons la norme du vecteurCross qui est devant l'ecran
                    let pointScreen = vectTrans(lastInScreenPoint, vectCrossScreen.newLen(distVectCross)); // Point d'intersection entre l'écran et la droite reliant les deux points
                    p = projectPoint(pointScreen);
                    paint.lineTo(p.x, p.y);
                    continue;
                }
            }
            if (outScreen) {
                outScreen = false;
                let vectCrossScreen = pointsToVect(point, lastOutScreenPoint); // Vecteur reliant le point devant au point derriere l'ecran
                // Ici, nous calulons d'abord la norme du vecteur vectCrossScreen quittant du point dans l'ecran vers le point d'intersection
                let distToScreen = vectScal(camPos.direction.unit, pointsToVect(camPos.p, point)) - camPos.screen + decalage; // Distance du dernier devant l'écran point à l'écran
                let distVectCross = distToScreen / Math.abs(vectScal(camPos.direction.unit, vectCrossScreen.unit)); // Nous obtenons la norme du vecteurCross qui est devant l'ecran
                let pointScreen = vectTrans(point, vectCrossScreen.newLen(distVectCross)); // Point d'intersection entre l'écran et la droite reliant les deux points
                p = projectPoint(pointScreen);
                if (!started) {
                    started = true;
                    firstInScreen = point;
                    paint.moveTo(p.x, p.y);
                } else {
                    paint.lineTo(p.x, p.y);
                }
            }
            p = projectPoint(point);
            lastInScreenPoint = point;
            if (!started) {
                started = true;
                firstInScreen = point;
                paint.moveTo(p.x, p.y);
            } else {
                paint.lineTo(p.x, p.y);
            }
        }
        if (firstOutScreen && started) {
            let point = firstInScreen;
            lastOutScreenPoint = firstOutPoint;
            let vectCrossScreen = pointsToVect(point, lastOutScreenPoint); // Vecteur reliant le point devant au point derriere l'ecran
            // Ici, nous calulons d'abord la norme du vecteur vectCrossScreen quittant du point dans l'ecran vers le point d'intersection
            let distToScreen = vectScal(camPos.direction.unit, pointsToVect(camPos.p, point)) - camPos.screen + decalage; // Distance du dernier devant l'écran point à l'écran
            let distVectCross = distToScreen / Math.abs(vectScal(camPos.direction.unit, vectCrossScreen.unit)); // Nous obtenons la norme du vecteurCross qui est devant l'ecran
            let pointScreen = vectTrans(point, vectCrossScreen.newLen(distVectCross)); // Point d'intersection entre l'écran et la droite reliant les deux points
            p = projectPoint(pointScreen);
            paint.lineTo(p.x, p.y);
        }
        if (this.stroke == undefined || this.stroke) {
            if (this.stroke != undefined) paint.strokeStyle = this.stroke;
            paint.stroke();
        }
        if (this.color == "none") return;
        if (vectScal(pointsToVect(camPos.p, this.cent()), this.vect) < 0) paint.fillStyle = this.color[0];
        else paint.fillStyle = this.color[1];
        paint.fill();
    }
    *givePoints() {}
    getAllPoints() {
        this.points = [];
        for (const point of this.givePoints()) {
            this.points.push(point);
        }
        this.initialised = true;
    }
}

/**
 * Pour les surfaces de droite
 */
class SurfaceLine extends Surface {
    /**
     *
     * @param {Point} a - Extremité N-W de la surface, point de départ pour dessiner
     * @param {string[]} color - Couleur de la surface
     * @param  {...Vector} vectors - les vecteurs des côtés dans l'ordre quittant du point de depart
     */
    constructor(a = newPoint(), color = ["blue", "red"], ...vects) {
        super();
        this.a = a;
        this.vectors = [];
        for (const vect of vects) {
            this.vectors.push(vect);
        }
        this.color = color;
        this.type = "surfaceLine";
    }
    get vect() {
        return vectProd(this.vectors[1], this.vectors[0]).unit;
    }

    cent() {
        // Je cherce un peu 4 points les plus eloignés de la surface dans les 2 directions de l
        let extrems = [this.a, this.a, this.a, this.a];
        for (const point of this.givePoints()) {
            let v = projectVector(camPos.base, pointsToVect(camPos.p, point));
            let v1 = projectVector(camPos.base, pointsToVect(camPos.p, extrems[0]));
            let v2 = projectVector(camPos.base, pointsToVect(camPos.p, extrems[1]));
            let v3 = projectVector(camPos.base, pointsToVect(camPos.p, extrems[2]));
            let v4 = projectVector(camPos.base, pointsToVect(camPos.p, extrems[3]));
            if (v.x < v1.x) extrems[0] = point;
            if (v.y > v2.y) extrems[1] = point;
            if (v.x > v3.x) extrems[2] = point;
            if (v.y < v4.y) extrems[3] = point;
        }
        return isoBar(extrems[0], extrems[1], extrems[2], extrems[3]);
    }

    *givePoints() {
        yield this.a;
        let p = this.a;
        for (let i = 0; i < this.vectors.length; i++) {
            p = vectTrans(p, this.vectors[i]);
            yield p;
        }
    }
}

function SurfacePoint(color = ["blue", "red"], points = [newPoint()]) {
    let a = points.at(0);
    let predPoint = a;
    let vects = [];
    for (const point of points) {
        if (point == a) continue;
        vects.push(pointsToVect(predPoint, point));
        predPoint = point;
    }
    if (predPoint != a) vects.push(pointsToVect(predPoint, a));
    let surface = new SurfaceLine(a, color);
    surface.vectors = vects;
    return surface;
}

class SurfaceRect extends SurfaceLine {
    /**
     *
     * @param {Point} a - Extremité N-W de la surface, point de départ pour dessiner
     * @param {string[]} color - Couleur de la surface
     * @param  {...Vector} vects - les deux vecteurs des cotés collés à l'extremité donnée
     */
    constructor(a = newPoint(), color = ["blue", "red"], ...vects) {
        let vect = [newVect()];
        vect.pop();
        for (const v of vects) {
            vect.push(v);
        }
        super(a, color, vect[0], vect[1], vect[0].normed(-1), vect[1].normed(-1));
        this.type = "surfaceRect";
        this.stroke = true;
    }
}

class Polygone extends Surface {
    constructor(o = newPoint(), n = 3, len = 100, vect = newVect(), color = ["blue", "lime"], rotate = 0) {
        super();
        this.vect = vect;
        this.color = color;
        this.rotate = rotate;
        this.center = o;
        this.len = len;
        this.n = n;
        this.type = "surfacePolygon";
    }
    cent() {
        return this.center;
    }
    *givePoints() {
        let base = getBaseFromVectZ(this.vect);
        if (this.n < 3) this.n = 3;
        let p = newPoint();
        let ang = 0;
        for (let i = 0; i <= this.n; i++) {
            ang = (2 * pi * i) / this.n;
            yield rotatePoint(
                this.cent(),
                vectTrans(this.center, vectSum(base[0].newLen(this.len * Math.cos(ang)), base[1].newLen(this.len * Math.sin(ang)))),
                this.rotate,
                base
            );
            //yield vectTrans(this.center, vectSum(base[0].newLen(this.len * Math.cos(ang)), base[1].newLen(this.len * Math.sin(ang))))
        }
    }
}

class SurfaceCircle extends Surface {
    constructor(o = newPoint(), radius = [0, 0], vect = newVect(0, 1, 0), color = ["dodgerBlue", "green"], startAngle = 0, endAngle = 2 * pi, rotate = 0) {
        super();
        this.color = color;
        this.center = o;
        this.radius = typeof radius == "number" ? [radius, radius] : radius;
        this.startAngle = startAngle;
        this.endAngle = endAngle;
        this.vect = vect;
        this.type = "surfaceCircle";
        this.rotate = rotate;
        this.setBase();
    }
    setBase() {
        this.vectX = newVect(this.vect.y, -this.vect.x, 0);
        this.vectY = vectProd(this.vect, this.vectX);
    }
    *givePoints() {
        let radiusX = this.radius[0];
        let radiusY = this.radius[1];
        let o = this.center;
        let p = newPoint();
        p = rotatePoint(o, newPoint(o.x + Math.cos(this.startAngle) * radiusX, o.y + Math.sin(this.startAngle) * radiusY), this.rotate);
        radiusY = radiusY != -1 ? radiusY : radiusX;
        let ang = this.startAngle;
        p = newPoint(Math.cos(ang) * radiusX, Math.sin(ang) * radiusY);
        p = vectSum(this.vectX.newLen(p.x), this.vectY.newLen(p.y));
        p = vectSum(p, newVect(o.x, o.y, o.z));
        yield p;
        for (let i = 0; i <= 8 * radiusX; i++) {
            ang = ((this.endAngle - this.startAngle) * i) / (8 * radiusX) + this.startAngle;
            p = newPoint(Math.cos(ang) * radiusX, Math.sin(ang) * radiusY);
            p = vectSum(this.vectX.newLen(p.x), this.vectY.newLen(p.y));
            p = vectSum(p, newVect(o.x, o.y, o.z));
            yield p;
        }
    }
}

/**
 * Cette classe c'est pour les surfaces omnipresentes
 * comme la terre ou le ciel qui ne sont pas defini ou qui seront toujours la
 * cette surface aura des coordonées non fixes et dependra de la position de l'observateur
 * sa definition est manuelle
 */
class InfiniteFlatSurface extends Surface {
    constructor(o = newPoint(0, 0, -200), vectFromPos = newVect(0, 0, 0), base = [newVect(1, 0, 0), newVect(0, 1, 0), newVect(0, 0, 1)], color = "darkgreen") {
        super();
        this.center = o;
        this.color = [color, color];
        this.baseOrigin = base;
        this.base = this.baseOrigin;
        this.vect = this.baseOrigin[2];
        this.len = 5000;
        this.vectFromPos = vectFromPos;
        this.type = "infiniteSurface";
    }
    *givePoints() {
        let vectY = camPos.direction;
        this.base = [camPos.base[0], projectVector(this.baseOrigin, camPos.direction)];
        let ang = 0;
        let oldZ = this.center.z;
        this.center = vectTrans(camPos.p, this.vectFromPos);
        this.center.z = oldZ;
        for (let i = 0; i <= 4; i++) {
            ang = (pi * i) / 4;
            yield vectTrans(this.center, vectSum(this.base[0].normed(this.len * Math.cos(ang)), this.base[1].normed(this.len * Math.sin(ang))));
        }
    }
}

/**
 * Pour des objets ayant plusieurs surfaces un peu comme le cube...
 */
class SurfaceObject {
    constructor(...surfaces) {
        this.surfaces = [new Surface()];
        this.surfaces.pop();
        this.type = "surfaceObject";
        this.stroke = "none";
        for (const surface of surfaces) {
            if (surface instanceof SurfaceObject) this.surfaces = this.surfaces.concat(surface.draw());
            else this.surfaces.push(surface);
        }
    }
    draw() {
        if (this.stroke != "none")
            this.surfaces.forEach((value, index, array) => {
                array[index].stroke = this.stroke;
            });
        for (let i = 0; i < this.surfaces.length; i++) {
            const element = this.surfaces[i];
            if (element.type == "surfaceJoinObject") {
            }
        }
        this.surfaces.sort((a, b) => {
            return -a.distance + b.distance;
        });
        return this.surfaces;
    }
}

/**
 * Pour les surfaces qui seront decoupés en de petites surfaces
 */
class SurfaceDivided extends SurfaceObject {
    constructor(a = newPoint(), numX = 1, numY = 1, lenX = 0, lenY = 0, vect = newVect(0, 1), color = [newColTab()], stillDivide = false) {
        super();
        this.colors = [];
        this.a = a;
        this.vect = vect;
        this.type = "surfaceDivided";
        this.base = getBaseFromVectZ(vect);
        // Ici nous recuperons les couleurs données
        if (color.length == 0) color = [newColTab(0)];
        for (let i = 0; i < color.length; i++) {
            //car num = 0 indique que c'est pour le reste des surfaces
            if (color[i].num == 0) for (let c = this.colors.length; c < numX * numY; c++) this.colors.push(color[i].color);
            else {
                for (let c = 0; c < color[i].num; c++) {
                    this.colors.push(color[i].color);
                }
            }
        }

        //Ici, nous créeons donc ces surfaces en questions
        let w = lenX / numX,
            h = lenY / numY;
        let sommet = newPoint();
        for (let i = 0; i < numX; i++) {
            sommet = vectTrans(a, this.base[0].newLen(w * i));
            for (let j = 0; j < numY; j++) {
                let surface;
                if (stillDivide) {
                    surface = new SurfaceDivided(sommet, parseInt(w / 10), parseInt(h / 10), w, h, vect, [new ColTab(0, this.colors[j * numX + i])], false);
                } else {
                    surface = new SurfaceRect(sommet, this.colors[j * numX + i], this.base[0].newLen(w + 0.5), this.base[1].newLen(-1 * h - 0.5));
                    surface.stroke = false;
                }
                this.surfaces.push(surface);
                sommet = vectTrans(sommet, this.base[1].newLen(-h));
            }
        }
    }
    draw() {
        if (this.surfaces[0] instanceof Surface) return this.surfaces;
        else {
            // Au cas où les sous surfaces sont des surfaces divisées
            let surfs = [new Surface()];
            surfs.pop();
            for (let i = 0; i < this.surfaces.length; i++) {
                surfs.push(this.surfaces[i]);
            }
            return surfs;
        }
    }
}

/**
 * Ceci est la classe pour une surface reliant deux surfaces identiques distinctes
 * un peu comme relier deux carrés ou deux trianlges et former un prisme
 */
class SurfaceJoinObject extends SurfaceObject {
    constructor(surf1 = new Surface(), surf2 = new Surface(), color = [["blue", "red"]]) {
        super();
        this.surf1 = surf1;
        this.surf2 = surf2;
        this.color = color;
        this.type = "surfaceJoinObject";
        this.getSurfaces();
    }
    getSurfaces() {
        let points1 = [];
        let points2 = [];
        for (const point of this.surf1.givePoints()) {
            points1.push(point);
        }
        for (const point of this.surf2.givePoints()) {
            points2.push(point);
        }
        if (points1.length != points2.length) {
            console.log("Les deux surfaces n'ont pas le même nombre de points");
            return false;
        }

        for (let i = 0; i < points1.length; i++) {
            if (this.color.length <= i) this.color.push(this.color[0]);
            this.surfaces.push(
                new SurfaceLine(
                    points1[i],
                    this.color[i],
                    pointsToVect(points1[i], points2[i]),
                    pointsToVect(points2[i], points2[(i + 1) % points1.length]),
                    pointsToVect(points2[(i + 1) % points1.length], points1[(i + 1) % points1.length]),
                    pointsToVect(points1[(i + 1) % points1.length], points1[i])
                )
            );
        }
    }
}

class CubeObject extends SurfaceObject {
    /**
     *
     * @param {Point} a Point N - W de la vue de fontVariantNumeric:
     * @param {number} len Arrête
     * @param {Vector} vectY Vecteur normal a la vue de face
     * @param {Vector} vectZ Vecteur normal a la vue de dessus
     */
    constructor(a = newPoint(), len = 100, color = ["blue", "red"], vectY = newVect(), vectZ = newVect()) {
        super();
        this.len = len;
        /**
         * les couleurs respectives des faces dans l'ordre: face, gauche, droite, derrière, haut, bas
         */
        this.colors = [color, color, color, color, color, color];
        this.base = [vectProd(vectY, vectZ).newLen(len), vectY.newLen(len), vectZ.newLen(len)];

        let face = new SurfaceLine(a, this.colors[0], this.base[0], this.base[2].normed(-1), this.base[0].normed(-1), this.base[2]);
        let left = new SurfaceLine(
            vectTrans(a, this.base[1].normed(-1)),
            this.colors[1],
            this.base[1],
            this.base[2].normed(-1),
            this.base[1].normed(-1),
            this.base[2]
        );
        let right = new SurfaceLine(vectTrans(a, this.base[0]), this.colors[2], this.base[1].normed(-1), this.base[2].normed(-1), this.base[1], this.base[2]);
        let behind = new SurfaceLine(
            vectTrans(left.a, this.base[0]),
            this.colors[3],
            this.base[0].normed(-1),
            this.base[2].normed(-1),
            this.base[0],
            this.base[2]
        );
        let top = new SurfaceLine(
            vectTrans(a, this.base[1].normed(-1)),
            this.colors[4],
            this.base[0],
            this.base[1],
            this.base[0].normed(-1),
            this.base[1].normed(-1)
        );
        let bottom = new SurfaceLine(
            vectTrans(a, this.base[2].normed(-1)),
            this.colors[5],
            this.base[0],
            this.base[1].normed(-1),
            this.base[0].normed(-1),
            this.base[1]
        );
        this.surfaces.push(face, left, right, behind, top, bottom);
    }
}

/**
 * La variable contenant le monde
 */
class World3d {
    constructor() {
        this.objects = [new Surface()];
        this.objects.pop();
        this.surfaces = [new Surface()];
        this.floor = new InfiniteFlatSurface();
    }
    get reference() {
        return this.floor.center.z;
    }
    draw() {
        this.surfaces = [];
        paint.clearRect(-can.width / 2, -can.height / 2, can.width, can.height);
        this.objects.forEach((v, ind) => {
            if (v instanceof Surface) this.surfaces.push(v);
            else if (v instanceof SurfaceObject) {
                this.surfaces = this.surfaces.concat(v.draw());
            }
        });
        this.surfaces.sort((a, b) => {
            let d = b.distance - a.distance;
            if (Math.abs(d) < 10) d = d;
            return d;
        });
        this.floor.draw();
        for (let i = 0; i < this.surfaces.length; i++) {
            this.surfaces[i].draw();
        }
    }
    addObject(...objects) {
        for (const object of objects) {
            this.objects.push(object);
        }
        this.draw();
    }
}

// ---Fonctions---
/**
 * Juste pour créer rapidement un point
 * @param {number} x - Coordonnée
 * @param {number} y - Coordonnée
 * @param {number} z - Coordonnée
 * @returns {Point}
 */
function newPoint(x = 0, y = 0, z = 0) {
    return new Point(x, y, z);
}

/**
 * Cette fonction retourne l'isoBarycentre
 * @param  {...Point} points les points
 */
function isoBar(...points) {
    let x = 0,
        y = 0,
        z = 0,
        i = 0;
    for (const point of points) {
        x += point.x;
        y += point.y;
        z += point.z;
        i++;
    }
    if (i == 0) return newPoint();
    return newPoint(x / i, y / i, z / i);
}

/**
 *
 * @param {Point} a - Un point de la droite
 * @param {Vector} u - Un vecteur directeur de la droite
 * @returns {Line} - La droite
 */
function newLine(a = newPoint(), u = newVect()) {
    return new Line(a, u);
}

/**
 * ceci crée facilement le segment
 * @param {Point} a - Premier extremité
 * @param {Point} u - Deuxième extremité
 * @param {number} len - Longueur du segment
 * @returns le segment
 */
function newSegment(a = 0, u = 0, len = 0) {
    return new Segment(a, u, len);
}

/**
 * Juste pour créer rapidement un vecteur
 * @param {number} x - Coordonnée
 * @param {number} y - Coordonnée
 * @param {number} z - Coordonnée
 * @returns {Vector}
 */
function newVect(x = 0, y = 0, z = 0) {
    return new Vector(x, y, z);
}

/**
 * Cette fonction calcule le determimant d'une matrice 2x2
 * @param {number} a - Membre au N-W (Nord - West)
 * @param {number} b - Membre au N-E
 * @param {number} c - Membre au S-W
 * @param {number} d - Membre au S-E
 * @returns {number} - Le determinant de la matrice 2x2
 */
function detMat2(a = 0, b = 0, c = 0, d = 0) {
    return a * d - b * c;
}
/**
 * Retourne le vecteur entre deux points
 * @param {Point} a - Premier point
 * @param {Point} b - Deuxième point
 * @returns {Vector} - Le vecteur
 */
function pointsToVect(a = newPoint(), b = newPoint()) {
    if (a == undefined || b == undefined) return newVect();
    return newVect(b.x - a.x, b.y - a.y, b.z - a.z);
}

/**
 * Cette fonction fait la somme de deux vecteurs
 * @param {Vector} u - Le premier vecteur
 * @param {Vector} v - Le deuxieme vecteur
 * @returns {Vector} - La somme de deux vecteurs
 */
function vectSum(...vectors) {
    let u = newVect();
    for (const v of vectors) {
        u = newVect(u.x + v.x, u.y + v.y, u.z + v.z);
    }
    return u;
}

function vectSub(u = new Vector(), v = new Vector()) {
    return vectSum(u, v.normed(-1));
}

/**
 * Cette fonction fait le produit scalaire de deux vecteurs
 * @param {Vector} u - Premier vecteur
 * @param {Vector} v - Deuxieme vecteur
 * @returns {Number} - Le produit scalaire
 */
function vectScal(u = newVect(), v = newVect()) {
    return u.coords
        .map((value, ind, a) => {
            return value * v.coords[ind];
        })
        .reduce((a, b, ind, ar) => {
            return a + b;
        });
}

/**
 * Cette fonction calcule et retourne le produit vectoriel de deux vecteurs
 * @param {Vector} u - Le premier vecteur
 * @param {Vector} v - Le deuxième vecteur
 * @returns {Vector} - Le produit vectoriel
 */
function vectProd(u = newVect(), v = newVect()) {
    let coords = [];
    for (var i = 1; i < 4; i++) {
        coords.push(detMat2(u.coords[i % 3], v.coords[i % 3], u.coords[(i + 1) % 3], v.coords[(i + 1) % 3]));
    }
    return newVect(coords[0], coords[1], coords[2]);
}

/**
 *
 * @param {Point} a - Premier point
 * @param {Vector} u -  Vecteur de translation
 * @returns Point de translation
 */
function vectTrans(a = newPoint(), ...vectors) {
    for (const u of vectors) {
        a = newPoint(a.x + u.x, a.y + u.y, a.z + u.z);
    }
    return a;
}

function drawEllipse(a = newPoint(), b = newPoint(), c = newPoint(), d = newPoint()) {
    let points = [a, b, c, d];
    let minX = a.x;
    let minY = a.y;
    let maxX = a.x;
    let maxY = a.y;
    for (let i = 0; i < points.length; i++) {
        let pt = points[i];
        minX = pt.x < minX ? pt.x : minX;
        maxX = pt.x > maxX ? pt.x : maxX;
        minY = pt.y < minY ? pt.y : minY;
        maxY = pt.y > maxY ? pt.y : maxY;
    }
}

function drawCicle(o = newPoint(), radiusX = 0, radiusY = -1, startAngle = 0, endAngle = 2 * pi, rotate = 0) {
    let p = newPoint();
    p = rotatePoint(o, newPoint(o.x + Math.cos(startAngle) * radiusX, o.y + Math.sin(startAngle) * radiusY), rotate);
    paint.moveTo(p.x, p.y);
    radiusY = radiusY != -1 ? radiusY : radiusX;
    let ang = 0;
    for (let i = 0; i < 1000 * radiusX; i++) {
        ang = ((endAngle - startAngle) * i) / (1000 * radiusX) + startAngle;
        p = rotatePoint(o, newPoint(o.x + Math.cos(ang) * radiusX, o.y + Math.sin(ang) * radiusY), rotate);
        paint.lineTo(p.x, p.y);
    }
}

function rotatePoint(o = newPoint(), a = newPoint(), angle = 0, base = [newVect(), newVect()]) {
    let vect = pointsToVect(o, a);
    let vectRot = rotateVect(vect, angle, base);
    return vectTrans(o, vectRot);
}

function projectVector(base = [newVect(), newVect()], vect = newVect()) {
    //return newVect(vectScal(base[0].unit, vect), vectScal(base[1].unit, vect))
    let proj1 = base[0].newLen(vectScal(base[0].unit, vect));
    return newVect(vectScal(base[0].unit, vect), vectScal(base[1].unit, vectSub(vect, proj1)));
}

let newProjectMode = false;
function projectPoint(p = newPoint()) {
    if (newProjectMode) return projectPoint2(p);
    else return projectPoint1(p);
}

/**
 * Ceci est la fonction mère de ce programme. Il projecte le point recu sur un plan dont le vecteur normal est colineaire a la direction de l'observateur et un peu distan de l'observateur
 * @param {Point} p - Le point à projeter
 * @returns Le point projété et prêt à passer au canvas
 */
function projectPoint1(p = newPoint()) {
    let c = vectProd(pointsToVect(camPos.p, p), camPos.direction).norm; //pour avoir
    let a = vectScal(pointsToVect(camPos.p, p), camPos.direction);
    c = (c * camPos.screen) / a; // ceci est la distance de ce point du centre de l'ecran
    let dir = pointsToVect(vectTrans(camPos.p, camPos.direction.newLen(a)), p);
    return projectVector(camPos.base, dir.newLen(c));
}

// Par projection spherique
function projectPoint2(p = newPoint()) {
    let dir0 = pointsToVect(camPos.p, p); // vecteur reliant l'observateur au point
    let dir1 = dir0.newLen(camPos.screen); // vecteur projetant sur l'écran spherique
    let dir2 = vectSub(dir1, camPos.direction);
    return projectVector(camPos.base, dir2);
}

function rotateVect(vect = newVect(), angle = 0, base = [newVect(1, 0, 0), newVect(0, 1, 0)]) {
    let x = vectScal(base[0], vect);
    let y = vectScal(base[1], vect);
    let x0 = x * Math.cos(angle) - y * Math.sin(angle);
    let y0 = x * Math.sin(angle) + y * Math.cos(angle);
    let result = vectSum(base[0].newLen(x0), base[1].newLen(y0));
    if (Math.abs(result.x) < 1e-10) result.x = 0;
    if (Math.abs(result.y) < 1e-10) result.y = 0;
    if (Math.abs(result.z) < 1e-10) result.z = 0;
    return result;
}

function getBaseFromVectZ(vect = newVect()) {
    if (vectProd(newVect(0, 0, 1), vect).norm == 0) return [newVect(1, 0, 0), vectProd(vect, newVect(1, 0, 0))];
    let vectX = newVect(-vect.y, vect.x, 0);
    return [vectX, vectProd(vect, vectX)];
}

function getBaseFromVectY(vect = newVect()) {
    let proj = projectVector([newVect(1, 0, 0), newVect(0, 1, 0)], vect);
    let angZ = getAngle(proj) - pi / 2;
    let vectX = rotateVect(newVect(1, 0, 0), angZ, [newVect(1, 0, 0), newVect(0, 1, 0)]);

    return [vectX, vectProd(vectX, vect)];
}

function getAngle(vect = newVect()) {
    if (vect.norm == 0) return pi / 2;
    let angle = Math.atan2(vect.y, vect.x);
    if (angle < 0) {
        angle += 2 * pi;
    }
    return angle;
}
/**
 * Cette fonction tronque un nombre decimal
 * @param {number} x Nombre à troncer
 * @param {number} n Nombre de decimal
 * @returns Le nombre troncé
 */
function intTronc(x, n = 3) {
    return parseInt(x * 10 ** n) / 10 ** n;
}

// objets
var camPos = {
    p: newPoint(200, 1000, 200),
    direction: newVect(0, 1, 0),
    base: [newVect(1, 0, 0), newVect(0, 0, 1)],
    screen: decalage + 10,
    angZ: 0,
    angX: 0,
};
camPos.p.y = -1000;

let mouseControlClick = true,
    mouseControl = false,
    mouseDown = false;
let lastMousePos = [-1, -1];

can.addEventListener("mousedown", () => {
    mouseDown = true;
});

can.addEventListener("mouseup", () => {
    mouseDown = false;
    lastMousePos = [-1, -1];
});

can.addEventListener("mouseleave", () => {
    mouseDown = false;
    lastMousePos = [-1, -1];
});

can.addEventListener("mousemove", (e) => {
    if (mouseControlClick && !mouseDown && !pointerLocked) return;
    if (!mouseControl && !mouseControlClick) return;
    if (lastMousePos[0] == -1) {
        lastMousePos = [e.clientX, e.clientY];
        return;
    }
    let dy = -e.clientY + lastMousePos[1];
    let dx = -e.clientX + lastMousePos[0];
    if (pointerLocked) {
        dx = -e.movementX * 6;
        dy = -e.movementY * 6;
    }
    lastMousePos = [e.clientX, e.clientY];
    if (dx == 0 && dy == 0) return;
    camPos.angZ += (dx * pi) / (can.width * 5);
    camPos.angZ = camPos.angZ % (2 * pi);
    camPos.angX += (dy * pi) / (can.width * 5);
    if (Math.abs(camPos.angX) > (pi * 0.5) / 2) camPos.angX = (Math.sign(camPos.angX) * pi * 0.5) / 2;
    camPos.direction = rotateVect(newVect(0, 1, 0), camPos.angZ, [newVect(1), newVect(0, 1, 0)]);
    camPos.direction = rotateVect(camPos.direction, camPos.angX, [camPos.direction, newVect(0, 0, 1)]);
    camPos.base[1] = rotateVect(newVect(0, 0, 1), camPos.angX, [camPos.direction.unit, newVect(0, 0, 1)]);
    camPos.base[0] = rotateVect(newVect(1, 0, 0), camPos.angZ, [newVect(1, 0, 0), newVect(0, 1, 0)]);
    document.querySelector("#xVect").textContent = camPos.base[0].toString();
    document.querySelector("#yVect").textContent = camPos.direction.toString();
    document.querySelector("#zVect").textContent = camPos.base[1].toString();
    document.querySelector("#ang").textContent = intTronc(camPos.angZ);
    world3D.draw();
});
document.querySelector("#xVect").textContent = camPos.base[0].toString();
document.querySelector("#yVect").textContent = camPos.direction.toString();
document.querySelector("#zVect").textContent = camPos.base[1].toString();
document.querySelector("#ang").textContent = camPos.angZ;

let docBody = document.body;
/**
 * Classe pour les setIntervals un peu <intelligent>
 */
class interGo {
    constructor(key, instruction = () => {}) {
        this.key = key;
        this.instruction = instruction;
        this.interval = setInterval(() => {}, 16);
        clearInterval(this.interval);
        this.state = false;
    }
    on() {
        if (this.state) return;
        this.state = true;
        this.interval = setInterval(() => {
            this.instruction();
        }, 20);
    }
    off() {
        if (!this.state) return;
        this.state = false;
        clearInterval(this.interval);
    }
}

let goLeft = new interGo("a", () => {
        camPos.p = vectTrans(camPos.p, camPos.base[0].newLen(-movePx));
    }),
    goRight = new interGo("d", () => {
        camPos.p = vectTrans(camPos.p, camPos.base[0].newLen(movePx));
    }),
    goUp = new interGo("w", () => {
        camPos.p = vectTrans(camPos.p, camPos.direction.newLen(movePx));
    }),
    goDown = new interGo("s", () => {
        camPos.p = vectTrans(camPos.p, camPos.direction.newLen(-movePx));
    }),
    goHigh = new interGo("q", () => {
        camPos.p = vectTrans(camPos.p, camPos.base[1].newLen(movePx));
    }),
    goLow = new interGo("e", () => {
        camPos.p = vectTrans(camPos.p, camPos.base[1].newLen(-movePx));
        if (camPos.p.z < 200) camPos.p.z = 200;
    }); // Les intervalles lorsqu'on va appuyers sur une direction

// Lorsqu'on appuie sur une touche
docBody.addEventListener("keydown", (e) => {
    let redraw = true;
    switch (e.code.toLowerCase()) {
        case "keyw":
            camPos.p = vectTrans(camPos.p, camPos.direction.newLen(movePx * 1.4));
            goUp.on();
            break;
        case "keya":
            camPos.p = vectTrans(camPos.p, camPos.base[0].newLen(-1.5 * movePx));
            goLeft.on();
            break;
        case "keys":
            camPos.p = vectTrans(camPos.p, camPos.direction.newLen(-movePx * 1.4));
            goDown.on();
            break;
        case "keyd":
            camPos.p = vectTrans(camPos.p, camPos.base[0].newLen(1.5 * movePx));
            goRight.on();
            break;
        case "keyq":
            camPos.p = vectTrans(camPos.p, camPos.base[1].newLen(movePx * 1.3));
            goHigh.on();
            break;
        case "keye":
            camPos.p = vectTrans(camPos.p, camPos.base[1].newLen(-movePx * 1.3));
            if (camPos.p.z < 200) camPos.p.z = 200;
            goLow.on();
            break;
        case "space":
            if (!jumping) nextFrameFuncs.push(jump);
            break;
        default:
            break;
    }
});
// Lorsqu'on relache la touche
docBody.addEventListener("keyup", (e) => {
    switch (e.key.toLowerCase()) {
        case "w":
            goUp.off();
            break;
        case "a":
            goLeft.off();
            break;
        case "s":
            goDown.off();
            break;
        case "d":
            goRight.off();
            break;
        case "q":
            goHigh.off();
            break;
        case "e":
            goLow.off();
            break;
        default:
            break;
    }
});

function reDraw() {
    if (camPos.p.z < 200) camPos.p.z = 200;
    document.querySelector("#xCoord").textContent = camPos.p.x;
    document.querySelector("#yCoord").textContent = camPos.p.y + camPos.screen;
    document.querySelector("#zCoord").textContent = camPos.p.z;
    world3D.draw();
}

// Corps du devoir
var world3D = new World3d();

let canPointerLocked = false;
can.addEventListener("dblclick", () => {
    can.requestPointerLock();
});

docBody.addEventListener("keypress", (e) => {
    if (e.key.toLowerCase() == "f" && !document.fullscreenElement)
        (async function () {
            try {
                await screen.orientation.lock("landscape");
            } catch (e) {}
            can.width = screen.width;
            can.height = screen.height;
            paint.translate(0, can.height);

            paint.scale(1, -1);
            paint.translate(can.width / 2, can.height / 2);
            await can.requestFullscreen();
        })();
});

document.querySelector("svg").addEventListener("click", async function () {
    try {
        await screen.orientation.lock("landscape");
    } catch (e) {}
    can.width = screen.width;
    can.height = screen.height;
    paint.translate(0, can.height);

    paint.scale(1, -1);
    paint.translate(can.width / 2, can.height / 2);
    await can.requestFullscreen();
});

let pointerLocked = false;

document.addEventListener("fullscreenchange", () => {
    if (document.fullscreenElement === can) {
        pointerLocked = true;
        can.requestPointerLock();
    } else {
        pointerLocked = false;
        can.width = 800;
        can.height = 800;
        paint.translate(0, can.height);

        //paint.scale(screen.height / 800, screen.width / 800)

        paint.scale(1, -1);
        paint.translate(can.width / 2, can.height / 2);
    }
});

document.addEventListener("pointerlockchange", () => {
    pointerLocked = document.pointerLockElement === can ?? false;
});

//var cube = new CubeObject(newPoint(0, 0, 0), 200, ["blue", "lime"], newVect(0, -1, 0), newVect(0, 0, 1))

// Test de jointure de deux surfacres ayant le même nombre de points
var poly = new Polygone(newPoint(200, 0, world3D.reference + 100), 11, 100, newVect(0, 1, 0), ["lime", "blue"]);
var poly2 = new Polygone(newPoint(200, 200, world3D.reference + 100), 11, 100, newVect(0, 1, 0), ["orange", "purple"]);
var colPoly = new SurfaceJoinObject(poly, poly2, [["tan", "yellow"]]);

// Test des surfaces découpés
var div = new SurfaceDivided(newPoint(200, 300, world3D.reference + 100), 10, 10, 100, 100, newVect(0, 1));
var div2 = new SurfaceDivided(newPoint(150, 350, world3D.reference + 150), 10, 10, 100, 100, newVect(-1), [newColTab(0, ["green", "yellow"])]);

// Construction d'une petite maison
let ref = world3D.reference;
let d0 = new SurfaceRect(newPoint(100, 100, 350 + ref), ["dodgerblue", "dodgerblue"], newVect(25).normed(5), newVect(0, 0, -70).normed(5)),
    d3 = new SurfaceRect(newPoint(475, 100, 350 + ref), ["dodgerblue", "dodgerblue"], newVect(60).normed(5), newVect(0, 0, -70).normed(5)),
    d4 = new SurfaceRect(newPoint(775, 100, 350 + ref), ["dodgerblue", "dodgerblue"], newVect(65).normed(5), newVect(0, 0, -70).normed(5)),
    d1 = new SurfaceRect(newPoint(100, 100, 500 + ref), ["dodgerblue", "dodgerblue"], newVect(200).normed(5), newVect(0, 0, -30).normed(5)),
    d2 = new SurfaceLine(
        newPoint(100, 100, 500 + ref),
        ["dodgerblue", "dodgerblue"],
        newVect(100, 0, 50).normed(5),
        newVect(100, 0, -50).normed(5),
        newVect(-200).normed(5)
    );

let devant = new SurfaceObject(d0, d1, d2, d3, d4);
devant.stroke = "dodgerblue";

let derriere = new SurfaceLine(
    newPoint(100, 1100, ref),
    ["red", "red"],
    newVect(0, 0, 100).normed(5),
    newVect(100, 0, 50).normed(5),
    newVect(100, 0, -50).normed(5),
    newVect(0, 0, -100).normed(5),
    newVect(-200).normed(5)
);
let murGauche = new SurfaceRect(newPoint(100, 1100, 500 + ref), ["orange", "orange"], newVect(0, -200).normed(5), newVect(0, 0, -100).normed(5));
let murDroit = new SurfaceRect(newPoint(1100, 100, 500 + ref), ["lime", "lime"], newVect(0, 200).normed(5), newVect(0, 0, -100).normed(5));
//let toitDroit = new SurfaceRect(newPoint(600, 0, 500 + ref + 250), ["yellow", "yellow"], newVect(100, 0, -50).normed(5), newVect(0, 200 + 200 / 5).normed(5))
//let toitGauche = new SurfaceRect(newPoint(600, 0, 500 + ref + 250), ["yellow", "yellow"], newVect(-100, 0, -50).normed(5), newVect(0, 200 + 200 / 5).normed(5))
world3D.floor = new InfiniteFlatSurface(newPoint(200, 500, 0));
//world3D.addObject(devant, murGauche, murDroit, derriere);
//world3D.addObject(poly, poly2, colPoly);
let mr1 = new SurfaceDivided(newPoint(100, 100, ref + 1000), 5, 1, 1000, 1000, newVect(0, 1, 0));
let mr2 = new SurfaceDivided(newPoint(50, 50, ref + 1000), 5, 1, 1000, 1000, newVect(1, 0, 0), [
    newColTab(2, ["green", "green"]),
    newColTab(2, ["red", "red"]),
    newColTab(1, ["yellow", "yellow"]),
]);

let sPoint = new SurfaceLine(
    newPoint(100, 100, ref + 100),
    ["lime", "lime"],
    newVect(25),
    newVect(0, 0, -75),
    newVect(50),
    newVect(0, 0, 75),
    newVect(25),
    newVect(0, 0, -100),
    newVect(-100),
    newVect(0, 0, 100)
);

function* easeOut(n = 2) {
    if (n < 2) n = 2;
    for (let i = 0; i <= n; i++) {
        yield Math.sin((pi * i) / (2 * n));
    }
}

// To jump when SPACE is powered at the next frame
let jumping = false; // Pour empecher de sauter en continue
let jump = (h = 40, n = 50) => {
    let i = 1;
    jumping = true;
    for (const progress of easeOut(n)) {
        setTimeout(() => {
            camPos.p.z += h * (1 - progress);
        }, 20 * i);
        i++;
    }
    setTimeout(() => {
        jumping = false;
    }, n * 20);
};

// Pour les fonctions qui seront executés au prochain dessinage
let nextFrameFuncs = [() => {}];
nextFrameFuncs.pop();

let drawing = setInterval(() => {
    if (camPos.p.z > 200) {
        camPos.p.z = camPos.p.z - 20;
    }
    for (let i = 1; i <= nextFrameFuncs.length; i++) {
        const func = nextFrameFuncs[nextFrameFuncs.length - i];
        func();
    }
    nextFrameFuncs = [];
    reDraw();
}, 20);
let mSuface = new MathSurface(newPoint(100, 100, ref + 50), newVect(0, 0, 1));

let divided = mSuface.divideSurface(sPoint),
    colors = [
        ["green", "green"],
        ["red", "red"],
        ["yellow", "yellow"],
    ];
console.log(divided);

for (let i = 0; i < divided.length; i++) {
    const surface = divided[i];
    world3D.addObject(new SurfacePoint(colors[i], surface));
}
