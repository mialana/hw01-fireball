#version 300 es

uniform mat4 u_Model;

uniform mat4 u_ModelInvTr;

uniform mat4 u_ViewProj;
uniform float u_Time;

uniform float u_lowAmp;
uniform float u_highAmp;

in vec4 vs_Pos;
in vec4 vs_Nor;
in vec4 vs_Col;

out vec4 fs_Nor;
out vec4 fs_LightVec;
out vec4 fs_Col;
out vec4 fs_Pos;
out float fs_Bump;

const vec4 lightPos = vec4(4.5, 5.2, 2.8, 1);

float hash(float p) {
    p = fract(p * 0.011); p *= p + 1.f; p *= p + p; return fract(p); 
}

float snoise(vec3 x) {
    const vec3 step = vec3(110, 241, 171);
    vec3 i = floor(x);
    vec3 f = fract(x);
    float n = dot(i, step);
    vec3 u = f * f * (3. - 2. * f);
    return mix(mix(mix(hash(n + dot(step, vec3(0, 0, 0))), 
                       hash(n + dot(step, vec3(1, 0, 0))), u.x),
                   mix(hash(n + dot(step, vec3(0, 1, 0))), 
                       hash(n + dot(step, vec3(1, 1, 0))), u.x), u.y),
                   mix(mix(hash(n + dot(step, vec3(0, 0, 1))), 
                           hash(n + dot(step, vec3(1, 0, 1))), u.x),
                   mix(hash(n + dot(step, vec3(0, 1, 1))), 
                       hash(n + dot(step, vec3(1, 1, 1))), u.x), u.y), u.z);
}

float fbm3d(vec3 x) {
    x *= 5.f;
	float v = 0.0;
	float a = 0.3;
	vec3 shift = vec3(100);
	for (int i = 0; i < 10; ++i) {
		v += a * snoise(x);
		x = x * 3.0 + shift;
		a *= 0.3;
	}
	return v;
}

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

void main()
{
    fs_Col = vs_Col;

    mat3 invTranspose = mat3(u_ModelInvTr);
    fs_Nor = vec4(invTranspose * vec3(vs_Nor), 0);

    vec4 fs_Pos = vs_Pos;

    fs_Bump = random3(fs_Nor.xyz + vec3(0, u_Time, 0)).x * u_highAmp + 
		5.f * fbm3d(fs_Nor.xyz + vec3(0, u_Time * 0.75, 0)) * u_lowAmp;

    fs_Pos += fs_Nor * 0.3 * fs_Bump;

    vec4 modelposition = u_Model * fs_Pos;
    fs_Pos = modelposition;

    fs_LightVec = lightPos - modelposition;
    gl_Position = u_ViewProj * modelposition;
}
