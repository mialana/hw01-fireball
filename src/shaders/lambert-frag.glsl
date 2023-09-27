#version 300 es

precision highp float;

uniform vec4 u_Color;
uniform vec4 u_Color2;
uniform mat4 u_Model;

in vec4 fs_Nor;
in vec4 fs_LightVec;
in vec4 fs_Col;
in vec4 fs_Pos;
in float fs_Bump;
out vec4 out_Col;

vec3 random3(vec3 p) {
 return fract(
    sin(
        vec3(
            dot(p.xy, vec2(127.1, 311.7)),
            dot(p.yz, vec2(269.5, 183.3)),
            dot(p.zx, vec2(20.1, 123.3))
            )
        ) * 43758.5453
 );
}

float WorleyNoise(vec3 uv) {
    uv *= 3.f;
    vec3 uvInt = floor(uv);
    vec3 uvFract = fract(uv);
    float minDist = 100.f;
    for(int z = -1; z <= 1; ++z){
        for(int y = -1; y <= 1; ++y) {
            for(int x = -1; x <= 1; ++x) {
                vec3 neighbor = vec3(float(x), float(y), float(z));
                vec3 point = random3(uvInt + neighbor);
                vec3 diff = neighbor + point - uvFract;
                float dist = length(diff);
                minDist = min(minDist, dist);
            }
        } 
    }
    return minDist;
}

float fbm3d(vec3 xyz) {
    float f;
   	f  = 0.5f * WorleyNoise(xyz);
	f += 0.25f * WorleyNoise(xyz);
	f += 0.1250 * WorleyNoise(xyz);
	f += 0.0625 * WorleyNoise(xyz);
	f = 0.5 + 0.5 * f;
	return f;
}

void main()
{
    vec4 diffuseColor = u_Color;

    float diffuseTerm = clamp(dot(fs_Nor,fs_LightVec), 0.f, 1.f);

    float ambientTerm = 0.2f;

    float lightIntensity = diffuseTerm + ambientTerm;

    vec4 center = -u_Model[3];

    float u = clamp(0.8 * (fs_Bump - 0.1) - fbm3d(fs_Nor.xyz), 0.f, 1.f);
    vec3 color = mix(diffuseColor.rgb, u_Color2.xyz, u);
    color = floor(color * 4.f) / 3.f;
    out_Col = vec4(color, 1.f);
}
