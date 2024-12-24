'use strict';

import { mat4 } from 'gl-matrix';

const vsSource = `#version 300 es
in vec3 aPosition;
in vec3 aNormal;
uniform mat4 uPerspectiveMatrix;
uniform mat4 uModelViewMatrix;
out vec4 vNormal;
out vec3 vPosition;

void main() {
    vec4 modeledNormal = uPerspectiveMatrix * uModelViewMatrix *  vec4(aNormal, 1.0);
    gl_Position = uPerspectiveMatrix * uModelViewMatrix * vec4(aPosition, 1.0);
    vNormal = modeledNormal;
    vPosition = aPosition;
}`;

const fsSource = `#version 300 es
precision mediump float;

in vec3 vPosition;
in vec4 vNormal;
out vec4 fragColor;
uniform vec3 uAmbientColor;
uniform vec3 uLightColor;
uniform vec3 uLightDirection;

void main() {
    vec3 offset = uLightDirection - vPosition;
    float distance = length(offset);
    vec4 direction = vec4(normalize(offset), 1.0);

    vec4 normal = normalize(vNormal);
    float brightness = max(dot(direction, normal), 0.0);
    float attenuation = 1.0 / (distance * distance);
    vec3 diffuseColor = uLightColor * brightness * attenuation;

    fragColor = vec4(uAmbientColor + diffuseColor, 1.0);
}`;


const modelViewMatrix = mat4.create();
const perspectiveMatrix = mat4.create();

mat4.lookAt(modelViewMatrix,[0, -0.3, 3.5], [0, 0, 0] ,[0, 1, 0]);

function main() {
    const canvas = document.querySelector("#glcanvas");
    const gl = canvas.getContext("webgl2");
    if (!gl) {
        console.log("Failde to get context for WebGL");
        return;
    }

    const program = gl.createProgram();
    const vsShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vsShader, vsSource);
    gl.compileShader(vsShader);
    gl.attachShader(program, vsShader);

    const fsShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fsShader, fsSource);
    gl.compileShader(fsShader);
    gl.attachShader(program, fsShader);

    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.log(gl.getShaderInfoLog(vsShader));
        console.log(gl.getShaderInfoLog(fsShader));
    }

    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);

    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.useProgram(program);

    const aPosition = gl.getAttribLocation(program, 'aPosition');
    const aNormal = gl.getAttribLocation(program, 'aNormal');
    const uPerspectiveMatrix = gl.getUniformLocation(program,"uPerspectiveMatrix");
    const uModelViewMatrix = gl.getUniformLocation(program, "uModelViewMatrix");
    const uAmbientColor = gl.getUniformLocation(program,'uAmbientColor');
    const uLightColor = gl.getUniformLocation(program,'uLightColor');
    const uLightDirection = gl.getUniformLocation(program,'uLightDirection');

    const ambientColor = [0, 0.3, 0];
    const lightColor = [1, 1, 1];
    const lightDirection = [1 ,1, 0];
    gl.uniform3f(uAmbientColor, ...ambientColor);
    gl.uniform3f(uLightColor, ...lightColor);
    gl.uniform3f(uLightDirection, ...lightDirection);

    const bufferData = new Float32Array([
        -.5,-.5,-.5,    -1, 0, 0,
        -.5, .5, .5,    -1, 0, 0,
        -.5, .5,-.5,    -1, 0, 0,
        -.5,-.5, .5,    -1, 0, 0,
        -.5, .5, .5,    -1, 0, 0,
        -.5,-.5,-.5,    -1, 0, 0,

        .5 ,-.5,-.5,    1, 0, 0,
        .5 , .5,-.5,    1, 0, 0,
        .5 , .5, .5,    1, 0, 0,
        .5 , .5, .5,    1, 0, 0,
        .5 ,-.5, .5,    1, 0, 0,
        .5 ,-.5,-.5,    1, 0, 0,

        -.5,-.5,-.5,    0, -1, 0,
         .5,-.5,-.5,    0, -1, 0,
         .5,-.5, .5,    0, -1, 0,
         .5,-.5, .5,    0, -1, 0,
        -.5,-.5, .5,    0, -1, 0,
        -.5,-.5,-.5,    0, -1, 0,

        -.5, .5,-.5,    0, 1, 0,
         .5, .5, .5,    0, 1, 0,
         .5, .5,-.5,    0, 1, 0,
        -.5, .5, .5,    0, 1, 0,
         .5, .5, .5,    0, 1, 0,
        -.5, .5,-.5,    0, 1, 0,

         .5,-.5,-.5,    0, 0, -1,
        -.5,-.5,-.5,    0, 0, -1,
         .5, .5,-.5,    0, 0, -1,
        -.5, .5,-.5,    0, 0, -1,
         .5, .5,-.5,    0, 0, -1,
        -.5,-.5,-.5,    0, 0, -1,

        -.5,-.5, .5,    0, 0, 1,
         .5,-.5, .5,    0, 0, 1,
         .5, .5, .5,    0, 0, 1,
         .5, .5, .5,    0, 0, 1,
        -.5, .5, .5,    0, 0, 1,
        -.5,-.5, .5,    0, 0, 1,
    ]);
    const buffer = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, bufferData, gl.STATIC_DRAW);

    gl.vertexAttribPointer(aPosition, 3 , gl.FLOAT, false, 6 * 4, 0);
    gl.vertexAttribPointer(aNormal, 3 , gl.FLOAT, false, 6 * 4, 3 * 4);

    gl.enableVertexAttribArray(aPosition);
    gl.enableVertexAttribArray(aNormal);

    const fovY = Math.PI / 4;
    const aspectRatio = canvas.width / canvas.height;

    const draw = () => {
        gl.clearColor(0, 0, 0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        //mat4.rotateY(modelViewMatrix, modelViewMatrix, 0.02);
        //const rotY = mat4.create();
        //const rotX = mat4.create();
        //mat4.rotateY(rotY, rotY, 0.02);
        //mat4.rotateX(rotX, rotX, 0.02);
        //mat4.multiply(rotY, rotY, rotX);
        //mat4.multiply(modelViewMatrix,modelViewMatrix,rotY);
        mat4.rotate(modelViewMatrix, modelViewMatrix, 0.02, [1,1,0]);
        mat4.perspectiveNO(perspectiveMatrix,fovY, aspectRatio, 0.1, 10);

        gl.uniformMatrix4fv(uPerspectiveMatrix, false, perspectiveMatrix);
        gl.uniformMatrix4fv(uModelViewMatrix, false, modelViewMatrix)
        gl.drawArrays(gl.TRIANGLES, 0, 36);
        requestAnimationFrame(draw)
    };
    draw();
};

window.onload = () => {
  main();
};