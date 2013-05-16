{
	"transform": {
		"position": {
			"x": 150,
			"y": 0,
			"z": 150
		}
	},
	"bodyDef": {
		"position": {
			"x": 0,
			"y": 0
		},
		"linearVelocity": {
			"x": 0,
			"y": 0
		},
		"angle": 0,
		"angularVelocity": 0,
		"linearDamping": 0,
		"angularDamping": 0,
		"allowSleep": true,
		"awake": true,
		"fixedRotation": false,
		"bullet": false,
		"type": 0,
		"active": true,
		"inertiaScale": 1
	},
	"fixDef": {
		"filter": {
			"categoryBits": 1,
			"maskBits": 65535,
			"groupIndex": 0
		},
		"shape": {
			"m_type": 1,
			"m_radius": 0.005,
			"m_centroid": {
				"x": 0,
				"y": 0
			},
			"m_vertices": [{
				"x": -33,
				"y": -43
			}, {
				"x": 33,
				"y": -43
			}, {
				"x": 33,
				"y": 43
			}, {
				"x": -33,
				"y": 43
			}],
			"m_normals": [{
				"x": 0,
				"y": -1
			}, {
				"x": 1,
				"y": 0
			}, {
				"x": 0,
				"y": 1
			}, {
				"x": -1,
				"y": 0
			}],
			"m_vertexCount": 4
		},
		"userData": null,
		"friction": 0.2,
		"restitution": 0,
		"density": 0,
		"isSensor": false
	},
	"modelName": "interior"
}