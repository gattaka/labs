import * as THREE from '../js/three.module.js';			

/*
 * Cloth Simulation using a relaxed constraints solver
 */

// Suggested Readings

// Advanced Character Physics by Thomas Jakobsen Character
// http://freespace.virgin.net/hugo.elias/models/m_cloth.htm
// http://en.wikipedia.org/wiki/Cloth_modeling
// http://cg.alexandra.dk/tag/spring-mass-system/
// Real-time Cloth Animation http://www.darwin3d.com/gamedev/articles/col0599.pdf
var Cloth = function () {
		
	const DAMPING = 0.03;
	const DRAG = 1 - DAMPING;
	const MASS = 0.1;
	const restDistance = 25;

	const xSegs = 10;
	const ySegs = 10;

	const clothFunction = plane( restDistance * xSegs, restDistance * ySegs );

	const cloth = new ClothMap( xSegs, ySegs );

	const GRAVITY = 981 * 1.4;
	const gravity = new THREE.Vector3( 0, - GRAVITY, 0 ).multiplyScalar( MASS );

	const TIMESTEP = 18 / 1000;
	const TIMESTEP_SQ = TIMESTEP * TIMESTEP;

	let pins = [];

	const windForce = new THREE.Vector3( 0, 0, 0 );
	const tmpForce = new THREE.Vector3();

	function plane( width, height ) {
		return function ( u, v, target ) {
			const x = ( u - 0.5 ) * width;
			const y = ( v + 0.5 ) * height;
			const z = 0;
			target.set( x, y, z );
		};
	}

	function Particle( x, y, z, mass ) {
		this.position = new THREE.Vector3();
		this.previous = new THREE.Vector3();
		this.original = new THREE.Vector3();
		this.a = new THREE.Vector3( 0, 0, 0 ); // acceleration
		this.mass = mass;
		this.invMass = 1 / mass;
		this.tmp = new THREE.Vector3();
		this.tmp2 = new THREE.Vector3();

		// init
		clothFunction( x, y, this.position ); // position
		clothFunction( x, y, this.previous ); // previous
		clothFunction( x, y, this.original );
	}

	// Force -> Acceleration

	Particle.prototype.addForce = function ( force ) {
		this.a.add(
			this.tmp2.copy( force ).multiplyScalar( this.invMass )
		);
	};

	// Performs Verlet integration

	Particle.prototype.integrate = function ( timesq ) {
		const newPos = this.tmp.subVectors( this.position, this.previous );
		newPos.multiplyScalar( DRAG ).add( this.position );
		newPos.add( this.a.multiplyScalar( timesq ) );

		this.tmp = this.previous;
		this.previous = this.position;
		this.position = newPos;

		this.a.set( 0, 0, 0 );
	};

	const diff = new THREE.Vector3();

	function satisfyConstraints( p1, p2, distance ) {
		diff.subVectors( p2.position, p1.position );
		const currentDist = diff.length();
		if ( currentDist === 0 ) return; // prevents division by 0
		const correction = diff.multiplyScalar( 1 - distance / currentDist );
		const correctionHalf = correction.multiplyScalar( 0.5 );
		p1.position.add( correctionHalf );
		p2.position.sub( correctionHalf );
	}

	function ClothMap( w, h ) {
		w = w || 10;
		h = h || 10;
		this.w = w;
		this.h = h;

		const particles = [];
		const constraints = [];

		// Create particles
		for ( let v = 0; v <= h; v ++ ) {
			for ( let u = 0; u <= w; u ++ ) {
				particles.push(
					new Particle( u / w, v / h, 0, MASS )
				);
			}
		}

		// Structural

		for ( let v = 0; v < h; v ++ ) {
			for ( let u = 0; u < w; u ++ ) {
				constraints.push( [
					particles[ index( u, v ) ],
					particles[ index( u, v + 1 ) ],
					restDistance
				] );

				constraints.push( [
					particles[ index( u, v ) ],
					particles[ index( u + 1, v ) ],
					restDistance
				] );
			}
		}

		for ( let u = w, v = 0; v < h; v ++ ) {
			constraints.push( [
				particles[ index( u, v ) ],
				particles[ index( u, v + 1 ) ],
				restDistance

			] );
		}

		for ( let v = h, u = 0; u < w; u ++ ) {
			constraints.push( [
				particles[ index( u, v ) ],
				particles[ index( u + 1, v ) ],
				restDistance
			] );
		}

		this.particles = particles;
		this.constraints = constraints;

		function index( u, v ) {
			return u + v * ( w + 1 );
		}

		this.index = index;
	}

	function simulate( now ) {
		const windStrength = Math.cos( now / 7000 ) * 30 + 50;

		windForce.set( Math.sin( now / 2000 ), Math.cos( now / 3000 ), Math.sin( now / 1000 ) );
		windForce.normalize();
		windForce.multiplyScalar( windStrength );

		// Aerodynamics forces

		const particles = cloth.particles;

		let indx;
		const normal = new THREE.Vector3();
		const indices = clothGeometry.index;
		const normals = clothGeometry.attributes.normal;
		for ( let i = 0, il = indices.count; i < il; i += 3 ) {
			for ( let j = 0; j < 3; j ++ ) {
				indx = indices.getX( i + j );
				normal.fromBufferAttribute( normals, indx );
				tmpForce.copy( normal ).normalize().multiplyScalar( normal.dot( windForce ) );
				particles[ indx ].addForce( tmpForce );

			}
		}

		for ( let i = 0, il = particles.length; i < il; i ++ ) {
			const particle = particles[ i ];
			particle.addForce( gravity );
			particle.integrate( TIMESTEP_SQ );
		}

		// Start Constraints

		const constraints = cloth.constraints;
		const il = constraints.length;

		for ( let i = 0; i < il; i ++ ) {
			const constraint = constraints[ i ];
			satisfyConstraints( constraint[ 0 ], constraint[ 1 ], constraint[ 2 ] );
		}

		// Floor Constraints
		for ( let i = 0, il = particles.length; i < il; i ++ ) {
			const particle = particles[ i ];
			const pos = particle.position;
			if ( pos.y < - 250 ) {
				pos.y = - 250;
			}
		}

		// Pin Constraints
		for ( let i = 0, il = pins.length; i < il; i ++ ) {
			const xy = pins[ i ];
			const p = particles[ xy ];
			p.position.copy( p.original );
			p.previous.copy( p.original );
		}
	}

	pins = [ 0, 11, 22, 33, 44, 55, 66, 77, 88, 99];

	let clothGeometry;
	let mesh;
				
	const loader = new THREE.TextureLoader();
	const clothTexture = loader.load( '../textures/vlajka.png' );
	clothTexture.anisotropy = 16;

	const clothMaterial = new THREE.MeshLambertMaterial( {
		map: clothTexture,
		side: THREE.DoubleSide,
		alphaTest: 0.5
	} );
					
	// cloth geometry

	clothGeometry = new THREE.ParametricBufferGeometry( clothFunction, cloth.w, cloth.h );

	// cloth mesh

	mesh = new THREE.Mesh( clothGeometry, clothMaterial );
	mesh.position.set( 0, 0, 0 );
	mesh.castShadow = true;

	mesh.customDepthMaterial = new THREE.MeshDepthMaterial( {
		depthPacking: THREE.RGBADepthPacking,
		map: clothTexture,
		alphaTest: 0.5
	});
		
	mesh.animate = function(now) {
		simulate( now );
		const p = cloth.particles;
		for ( let i = 0, il = p.length; i < il; i ++ ) {
			const v = p[ i ].position;
			clothGeometry.attributes.position.setXYZ( i, v.x, v.y, v.z );
		}
		clothGeometry.attributes.position.needsUpdate = true;
		clothGeometry.computeVertexNormals();
	};
	
	return mesh;
};

export { Cloth };