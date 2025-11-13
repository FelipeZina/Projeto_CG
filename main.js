// main.js

// --- 1. SHADERS ---
// (ESTA PARTE ESTAVA FALTANDO)

const vertexShaderSource = `
    // Atributos (dados que vêm dos buffers)
    attribute vec4 a_Position;  // Posição do vértice
    attribute vec4 a_Color;     // Cor do vértice

    // Uniforms (dados globais para todos os vértices)
    uniform mat4 u_ModelMatrix;
    uniform mat4 u_ViewMatrix;
    uniform mat4 u_ProjectionMatrix;

    // Varying (passa dados para o fragment shader)
    varying vec4 v_Color;

    void main() {
        // Calcula a posição final do vértice no espaço da tela
        gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_ModelMatrix * a_Position;
        
        // Passa a cor para o fragment shader
        v_Color = a_Color;
    }
`;

const fragmentShaderSource = `
    // Define a precisão dos números de ponto flutuante
    precision mediump float; 

    // Recebe a cor interpolada do vertex shader
    varying vec4 v_Color;

    void main() {
        // Define a cor final do pixel
        gl_FragColor = v_Color;
    }
`;

// --- 2. FUNÇÃO PRINCIPAL ---
// (Esta parte você já tem)
function main() {
    // --- SETUP INICIAL ---
    const canvas = document.getElementById("gameCanvas");
    const gl = canvas.getContext("webgl");

    if (!gl) {
        console.error("WebGL não suportado!");
        return;
    }

    // Redimensiona o canvas para preencher a tela
    resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // --- COMPILAÇÃO DOS SHADERS ---
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    const program = createProgram(gl, vertexShader, fragmentShader);

    // --- LOCALIZAÇÃO DOS ATRIBUTOS E UNIFORMS ---
    // Precisamos saber "onde" no programa da GPU estão nossas variáveis
    const positionAttribLocation = gl.getAttribLocation(program, "a_Position");
    const colorAttribLocation = gl.getAttribLocation(program, "a_Color");

    const modelMatrixUniformLocation = gl.getUniformLocation(program, "u_ModelMatrix");
    const viewMatrixUniformLocation = gl.getUniformLocation(program, "u_ViewMatrix");
    const projectionMatrixUniformLocation = gl.getUniformLocation(program, "u_ProjectionMatrix");

    // --- 3. DADOS DO CUBO (GEOMETRIA) ---
    // Vértices (8 cantos de um cubo)
    const vertices = [
        // Frente
        -1.0, -1.0,  1.0,
         1.0, -1.0,  1.0,
         1.0,  1.0,  1.0,
        -1.0,  1.0,  1.0,
        // Trás
        -1.0, -1.0, -1.0,
        -1.0,  1.0, -1.0,
         1.0,  1.0, -1.0,
         1.0, -1.0, -1.0,
        // Cima
        -1.0,  1.0, -1.0,
        -1.0,  1.0,  1.0,
         1.0,  1.0,  1.0,
         1.0,  1.0, -1.0,
        // Baixo
        -1.0, -1.0, -1.0,
         1.0, -1.0, -1.0,
         1.0, -1.0,  1.0,
        -1.0, -1.0,  1.0,
        // Direita
         1.0, -1.0, -1.0,
         1.0,  1.0, -1.0,
         1.0,  1.0,  1.0,
         1.0, -1.0,  1.0,
        // Esquerda
        -1.0, -1.0, -1.0,
        -1.0, -1.0,  1.0,
        -1.0,  1.0,  1.0,
        -1.0,  1.0, -1.0,
    ];

    // Cores (uma cor para cada face)
    const faceColors = [
        [1.0, 0.0, 0.0, 1.0], // Frente: Vermelho
        [0.0, 1.0, 0.0, 1.0], // Trás: Verde
        [0.0, 0.0, 1.0, 1.0], // Cima: Azul
        [1.0, 1.0, 0.0, 1.0], // Baixo: Amarelo
        [1.0, 0.0, 1.0, 1.0], // Direita: Magenta
        [0.0, 1.0, 1.0, 1.0], // Esquerda: Ciano
    ];

    // Converte as cores das faces para um array de cores por vértice
    let colors = [];
    for (let j = 0; j < faceColors.length; ++j) {
        const c = faceColors[j];
        colors = colors.concat(c, c, c, c); // 4 vértices por face
    }

    // Índices (define como os vértices se conectam para formar triângulos)
    // Isso nos permite reutilizar vértices
    const indices = [
        0,  1,  2,      0,  2,  3,    // Frente
        4,  5,  6,      4,  6,  7,    // Trás
        8,  9,  10,     8,  10, 11,   // Cima
        12, 13, 14,     12, 14, 15,   // Baixo
        16, 17, 18,     16, 18, 19,   // Direita
        20, 21, 22,     20, 22, 23,   // Esquerda
    ];

    // --- 4. BUFFERS (Enviando dados para a GPU) ---
    
    // Buffer de Vértices (VBO)
    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    // Buffer de Cores
    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

    // Buffer de Índices (IBO)
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

    // --- 5. CONFIGURAÇÃO DAS MATRIZES (Usando gl-matrix.js) ---
    
    // Matriz de Projeção (Perspectiva)
    const projectionMatrix = mat4.create();
    const fieldOfView = 45 * Math.PI / 180; // em radianos
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const zNear = 0.1;
    const zFar = 100.0;
    mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);

    // Matriz de Visualização (Câmera)
    const viewMatrix = mat4.create();
    // Posição da câmera: (0, 0, -6)
    // Olhando para: (0, 0, 0)
    // Vetor "para cima": (0, 1, 0)
    mat4.lookAt(viewMatrix, [0, 0, 6], [0, 0, 0], [0, 1, 0]);

    // Matriz do Modelo (Posição/Rotação/Escala do objeto)
    const modelMatrix = mat4.create(); // Começa como matriz identidade

    // --- 6. O LOOP DE RENDERIZAÇÃO (requestAnimationFrame) ---
    let cubeRotation = 0.0;

    function draw(now) {
        now *= 0.001; // converte tempo para segundos
        const deltaTime = now - (then || 0);
        then = now;
        
        // --- LIMPEZA E PREPARAÇÃO ---
        gl.clearColor(0.1, 0.1, 0.1, 1.0); // Cinza escuro
        gl.clearDepth(1.0);                // Limpa tudo
        gl.enable(gl.DEPTH_TEST);          // Habilita teste de profundidade
        gl.depthFunc(gl.LEQUAL);           // Coisas próximas escondem coisas distantes
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // --- ATUALIZAÇÃO (Rotação do Cubo) ---
        mat4.identity(modelMatrix); // Reseta a matriz do modelo
        mat4.rotate(modelMatrix,  // matriz de destino
                    modelMatrix,  // matriz para rotacionar
                    cubeRotation, // quantidade de rotação
                    [0, 1, 0]);   // eixo de rotação (Y)
        mat4.rotate(modelMatrix,
                    modelMatrix,
                    cubeRotation * 0.7,
                    [1, 0, 0]);   // eixo de rotação (X)

        cubeRotation += deltaTime; // Atualiza a rotação para o próximo frame

        // --- ATIVAÇÃO DOS BUFFERS E SHADERS ---
        gl.useProgram(program);

        // Aponta o atributo a_Position para o buffer de vértices
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.vertexAttribPointer(
            positionAttribLocation, // local do atributo
            3,                      // número de componentes por vértice (X, Y, Z)
            gl.FLOAT,               // tipo dos dados
            false,                  // normalizar?
            0,                      // stride (0 = auto)
            0);                     // offset (0 = auto)
        gl.enableVertexAttribArray(positionAttribLocation);

        // Aponta o atributo a_Color para o buffer de cores
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        gl.vertexAttribPointer(
            colorAttribLocation, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(colorAttribLocation);

        // Define o buffer de índices como o ativo
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

        // --- ENVIO DAS MATRIZES (UNIFORMS) ---
        gl.uniformMatrix4fv(projectionMatrixUniformLocation, false, projectionMatrix);
        gl.uniformMatrix4fv(viewMatrixUniformLocation, false, viewMatrix);
        gl.uniformMatrix4fv(modelMatrixUniformLocation, false, modelMatrix);

        // --- DESENHAR! ---
        gl.drawElements(
            gl.TRIANGLES,       // desenhar triângulos
            36,                 // 36 índices (6 faces * 2 triângulos/face * 3 vértices/triângulo)
            gl.UNSIGNED_SHORT,  // tipo dos dados dos índices
            0                   // offset
        );

        // Chama o próximo frame
        requestAnimationFrame(draw);
    }

    // Inicia o loop
    let then = 0;
    requestAnimationFrame(draw);
}

// --- 7. FUNÇÕES UTILITÁRIAS (para compilar shaders) ---

function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        return shader;
    }
    console.error(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
}

function createProgram(gl, vertexShader, fragmentShader) {
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
        return program;
    }
    console.error(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
}

function resizeCanvasToDisplaySize(canvas) {
    const displayWidth  = canvas.clientWidth;
    const displayHeight = canvas.clientHeight;
    if (canvas.width  !== displayWidth || canvas.height !== displayHeight) {
        canvas.width  = displayWidth;
        canvas.height = displayHeight;
        return true;
    }
    return false;
}

// --- 8. INICIAR A APLICAÇÃO ---
main();
