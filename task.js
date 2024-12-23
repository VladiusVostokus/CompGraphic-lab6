'use strict';

const vsSource = `#version 300 es
in vec3 aPosition;
in vec3 aNormal;
uniform mat4 uTransformMatrix;
uniform mat4 uPerspectiveMatrix;
uniform mat4 uModelViewMatrix;
out vec4 vNormal;
out vec3 vPosition;

void main() {
    vec4 modeledNormal = uPerspectiveMatrix * uModelViewMatrix * uTransformMatrix * vec4(aNormal, 1.0);
    vec4 normalizedNormal = normalize(modeledNormal);
    gl_Position = uPerspectiveMatrix * uModelViewMatrix * uTransformMatrix * vec4(aPosition, 1.0);
    vNormal = normalizedNormal;
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
    float attenuation = 1.0 / (distance * distance);
    float brightness = max(dot(direction, normal), 0.0);
    vec3 diffuseColor = uLightColor * brightness;

    fragColor = vec4(uAmbientColor + diffuseColor, 1.0);
}`;

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
    const uTransformMatrix = gl.getUniformLocation(program,'uTransformMatrix');
    const uPerspectiveMatrix = gl.getUniformLocation(program,"uPerspectiveMatrix");
    const uModelViewMatrix = gl.getUniformLocation(program, "uModelViewMatrix");
    const uAmbientColor = gl.getUniformLocation(program,'uAmbientColor');
    const uLightColor = gl.getUniformLocation(program,'uLightColor');
    const uLightDirection = gl.getUniformLocation(program,'uLightDirection');

    const ambientColor = [0, 0.3, 0];
    const lightColor = [1, 1, 1];
    const lightDirection = [1 ,1, -0.5];
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

    const perspective = (fovy, aspect, near, far) => {
        var f = Math.tan(Math.PI * 0.5 - 0.5 * fovy);
        var rangeInv = 1.0 / (near - far);

        return [
            f / aspect, 0, 0, 0,
            0, f, 0, 0,
            0, 0, (near + far) * rangeInv, -1,
            0, 0, near * far * rangeInv * 2, 0
        ];
    };

    const translate = (translationVec) => {
        let x = translationVec[0], y = translationVec[1], z = translationVec[2];
        const matrix = [
            1,0,0,0,
            0,1,0,0,
            0,0,1,0,
            0,0,0,1,
        ]
        matrix[12] = matrix[0] * x + matrix[4] * y + matrix[8] * z + matrix[12];
        matrix[13] = matrix[1] * x + matrix[5] * y + matrix[9] * z + matrix[13];
        matrix[14] = matrix[2] * x + matrix[6] * y + matrix[10] * z + matrix[14];
        matrix[15] = matrix[3] * x + matrix[7] * y + matrix[11] * z + matrix[15];
        return matrix;
    }

    const multiply = (a, b) => {
        var a00 = a[0 * 4 + 0], a01 = a[0 * 4 + 1], a02 = a[0 * 4 + 2], a03 = a[0 * 4 + 3];
        var a10 = a[1 * 4 + 0], a11 = a[1 * 4 + 1], a12 = a[1 * 4 + 2], a13 = a[1 * 4 + 3];
        var a20 = a[2 * 4 + 0], a21 = a[2 * 4 + 1], a22 = a[2 * 4 + 2], a23 = a[2 * 4 + 3];
        var a30 = a[3 * 4 + 0], a31 = a[3 * 4 + 1], a32 = a[3 * 4 + 2], a33 = a[3 * 4 + 3];
        var b00 = b[0 * 4 + 0], b01 = b[0 * 4 + 1], b02 = b[0 * 4 + 2], b03 = b[0 * 4 + 3];
        var b10 = b[1 * 4 + 0], b11 = b[1 * 4 + 1], b12 = b[1 * 4 + 2], b13 = b[1 * 4 + 3];
        var b20 = b[2 * 4 + 0], b21 = b[2 * 4 + 1], b22 = b[2 * 4 + 2], b23 = b[2 * 4 + 3];
        var b30 = b[3 * 4 + 0], b31 = b[3 * 4 + 1], b32 = b[3 * 4 + 2], b33 = b[3 * 4 + 3];
      
        return [
          b00 * a00 + b01 * a10 + b02 * a20 + b03 * a30,
          b00 * a01 + b01 * a11 + b02 * a21 + b03 * a31,
          b00 * a02 + b01 * a12 + b02 * a22 + b03 * a32,
          b00 * a03 + b01 * a13 + b02 * a23 + b03 * a33,
          b10 * a00 + b11 * a10 + b12 * a20 + b13 * a30,
          b10 * a01 + b11 * a11 + b12 * a21 + b13 * a31,
          b10 * a02 + b11 * a12 + b12 * a22 + b13 * a32,
          b10 * a03 + b11 * a13 + b12 * a23 + b13 * a33,
          b20 * a00 + b21 * a10 + b22 * a20 + b23 * a30,
          b20 * a01 + b21 * a11 + b22 * a21 + b23 * a31,
          b20 * a02 + b21 * a12 + b22 * a22 + b23 * a32,
          b20 * a03 + b21 * a13 + b22 * a23 + b23 * a33,
          b30 * a00 + b31 * a10 + b32 * a20 + b33 * a30,
          b30 * a01 + b31 * a11 + b32 * a21 + b33 * a31,
          b30 * a02 + b31 * a12 + b32 * a22 + b33 * a32,
          b30 * a03 + b31 * a13 + b32 * a23 + b33 * a33,
        ];
    };

    let angle = 0.0;

    const draw = () => {
        gl.clearColor(0, 0, 0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        const radian = Math.PI * angle / 180;
        const cos = Math.cos(radian);
        const sin = Math.sin(radian);
        if (angle === 360.0) angle = 0.0;
        angle++;
        const modelViewMatrix = translate([0, -0.3, -3.5]);
        const perspectiveMatrix = perspective(fovY, aspectRatio, 0.1, 10);

        const projectionMatrix_Y = [
            cos,0,-sin,0,
            0,1,0,0,
            sin,0,cos,0,
            0,0,0,1,
        ];

        const projectionMatrix_X = new Float32Array([
            1,0,0,0,
            0,cos,sin,0,
            0,-sin,cos,0,
            0,0,0,1,
        ]);

        const transformMatrix = multiply(projectionMatrix_Y, projectionMatrix_X)

        gl.uniformMatrix4fv(uTransformMatrix, false,  transformMatrix);
        gl.uniformMatrix4fv(uPerspectiveMatrix, false, perspectiveMatrix);
        gl.uniformMatrix4fv(uModelViewMatrix, false, modelViewMatrix)
        gl.drawArrays(gl.TRIANGLES, 0, 36);
        requestAnimationFrame(draw)
    };
    draw();
}