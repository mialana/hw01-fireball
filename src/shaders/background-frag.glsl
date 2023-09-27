#version 300 es
precision highp float;

uniform vec3 u_Eye, u_Ref, u_Up;
uniform vec2 u_Dimensions;
uniform float u_Time;

in vec2 fs_Pos;
out vec4 out_Col;

float gradient(float k,float x){
	float h = k*x;
	return h*exp(1.f-h);
}

float easeInOut(in vec2 pos ) 
{
	vec2 p = pos;
	p.x *= u_Dimensions.x/u_Dimensions.y;
	
	float radius = length(p);

	radius = smoothstep(0.2,1.0,radius);

    radius *= sin(u_Time);

	float color  = 1.0 - 1.5*radius;

	color = gradient(1.,color);
	return pow(max(color,0.),2.);
}

void main() {
    vec3 color = vec3(1, 0.1, 0) * (easeInOut(fs_Pos)*0.8);
	out_Col = vec4(color,1.);
}
