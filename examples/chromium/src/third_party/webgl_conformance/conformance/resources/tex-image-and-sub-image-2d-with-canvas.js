/*
** Copyright (c) 2012 The Khronos Group Inc.
**
** Permission is hereby granted, free of charge, to any person obtaining a
** copy of this software and/or associated documentation files (the
** "Materials"), to deal in the Materials without restriction, including
** without limitation the rights to use, copy, modify, merge, publish,
** distribute, sublicense, and/or sell copies of the Materials, and to
** permit persons to whom the Materials are furnished to do so, subject to
** the following conditions:
**
** The above copyright notice and this permission notice shall be included
** in all copies or substantial portions of the Materials.
**
** THE MATERIALS ARE PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
** EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
** MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
** IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
** CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
** TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
** MATERIALS OR THE USE OR OTHER DEALINGS IN THE MATERIALS.
*/

function generateTest(pixelFormat, pixelType, prologue) {
    var wtu = WebGLTestUtils;
    var gl = null;
    var textureLoc = null;
    var successfullyParsed = false;

    var init = function()
    {
        if (window.initNonKhronosFramework) {
            window.initNonKhronosFramework(true);
        }

        description('Verify texImage2D and texSubImage2D code paths taking canvas elements (' + pixelFormat + '/' + pixelType + ')');

        gl = wtu.create3DContext("example");

        if (!prologue(gl)) {
            finishTest();
            return;
        }

        var program = wtu.setupTexturedQuad(gl);

        gl.clearColor(0,0,0,1);
        gl.clearDepth(1);

        var testCanvas = document.createElement('canvas');
        testCanvas.width = 1;
        testCanvas.height = 2;
        var ctx = testCanvas.getContext("2d");
        ctx.fillStyle = "#ff0000";
        ctx.fillRect(0,0,1,1);
        ctx.fillStyle = "#00ff00";
        ctx.fillRect(0,1,1,1);
        runTest(testCanvas);
    }

    function runOneIteration(image, useTexSubImage2D, flipY, topColor, bottomColor)
    {
        debug('Testing ' + (useTexSubImage2D ? 'texSubImage2D' : 'texImage2D') +
              ' with flipY=' + flipY);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        // Disable any writes to the alpha channel
        gl.colorMask(1, 1, 1, 0);
        var texture = gl.createTexture();
        // Bind the texture to texture unit 0
        gl.bindTexture(gl.TEXTURE_2D, texture);
        // Set up texture parameters
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        // Set up pixel store parameters
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, flipY);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
        gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
        // Upload the image into the texture
        if (useTexSubImage2D) {
            // Initialize the texture to black first
            gl.texImage2D(gl.TEXTURE_2D, 0, gl[pixelFormat], image.width, image.height, 0,
                          gl[pixelFormat], gl[pixelType], null);
            gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl[pixelFormat], gl[pixelType], image);
        } else {
            gl.texImage2D(gl.TEXTURE_2D, 0, gl[pixelFormat], gl[pixelFormat], gl[pixelType], image);
        }

        // Point the uniform sampler to texture unit 0
        gl.uniform1i(textureLoc, 0);
        // Draw the triangles
        wtu.drawQuad(gl, [0, 0, 0, 255]);
        // Check a few pixels near the top and bottom and make sure they have
        // the right color.
        debug("Checking lower left corner");
        wtu.checkCanvasRect(gl, 4, 4, 2, 2, bottomColor,
                            "shouldBe " + bottomColor);
        debug("Checking upper left corner");
        wtu.checkCanvasRect(gl, 4, gl.canvas.height - 8, 2, 2, topColor,
                            "shouldBe " + topColor);
    }

    function runTest(image)
    {
        var red = [255, 0, 0];
        var green = [0, 255, 0];
        runOneIteration(image, false, true, red, green);
        runOneIteration(image, false, false, green, red);
        runOneIteration(image, true, true, red, green);
        runOneIteration(image, true, false, green, red);

        glErrorShouldBe(gl, gl.NO_ERROR, "should be no errors");
        finishTest();
    }

    return init;
}
