/*

*/
var JsChip8 = function () {
    'use strict';

    var display = [],// new Uint8Array(32 * 64 - 1), 
		memory = [],
		stack = [],
		rV,
		rI,
		SP,
		PC,
		delayTimer,
		soundTimer;

    function initialization() {
        for (var i = 0, len = 64 * 32; i < len; i++)
            display[i] = new Pixel();
        memory = new Uint8Array(4095);
        stack = new Uint8Array(15);
        rV = new Uint8Array(4095);
        rI = 0;
        SP = 0;
        PC = 0x200;
        delayTimer = 0;
        soundTimer = 0;
        memory.set([
            0xF0, 0x90, 0x90, 0x90, 0xF0,	// 0
            0x20, 0x60, 0x20, 0x20, 0x70,	// 1
            0xF0, 0x10, 0xF0, 0x80, 0xF0,	// 2
            0xF0, 0x10, 0xF0, 0x10, 0xF0,	// 3
            0x90, 0x90, 0xF0, 0x10, 0x10,	// 4
            0xF0, 0x80, 0xF0, 0x10, 0xF0,	// 5
            0xF0, 0x80, 0xF0, 0x90, 0xF0,	// 6
            0xF0, 0x10, 0x20, 0x40, 0x40,	// 7
            0xF0, 0x90, 0xF0, 0x90, 0xF0,	// 8
            0xF0, 0x90, 0xF0, 0x10, 0xF0,	// 9
            0xF0, 0x90, 0xF0, 0x90, 0x90,	// A
            0xE0, 0x90, 0xE0, 0x90, 0xE0,	// B
            0xF0, 0x80, 0x80, 0x80, 0xF0,	// C
            0xE0, 0x90, 0x90, 0x90, 0xE0,	// D
            0xF0, 0x80, 0xF0, 0x80, 0xF0,	// E
			0xF0, 0x80, 0xF0, 0x80, 0x80	// F
        ], 80);
    }


    /* Draws a sprite at coordinate (VX, VY) that has a width of 8 pixels and a height of N pixels.
	Each row of 8 pixels is read as bit-coded (with the most significant bit of each byte displayed on the left)
	starting from memory location I; I value doesn't change after the execution of this instruction. As described
	above, VF is set to 1 if any screen pixels are flipped from set to unset when the sprite is drawn, and to 0 if that doesn't happen. */



    /*
	unsigned short x = V[(opcode & 0x0F00) >> 8];
			unsigned short y = V[(opcode & 0x00F0) >> 4];
			unsigned short height = opcode & 0x000F;
			unsigned short pixel;

			V[0xF] = 0;
			for (int yline = 0; yline < height; yline++)
			{
				pixel = memory[I + yline];
				for(int xline = 0; xline < 8; xline++)
				{
					if((pixel & (0x80 >> xline)) != 0)
					{
						if(gfx[(x + xline + ((y + yline) * 64))] == 1)
						{
							V[0xF] = 1;                                    
						}
						gfx[x + xline + ((y + yline) * 64)] ^= 1;
					}
				}
			}
	*/

    function drawSprite(sprite, x, y) {

        var width = 8,
			height = sprite.length,
			pos,
			bit;

        rV[0xF] = 0;

        for (var iH = 0; iH < height; iH++) {
            for (var iW = width - 1; iW >= 0; iW--) {
                pos = (y + iH) * 64 + (x + iW);
                bit = sprite[iH] & 0x1;
                if (bit === 0x1) {
                    rV[0xF] = 1;
                    display[pos].add();
                }
                else display[pos].rem();
                sprite[iH] >>= 1;
            }
        }

    }

    this.getDisplay = function () {
        return display;
    }


    this.step = function () {
        var opcode = memory[PC] << 8 | memory[PC + 1];
        PC += 2;
        switch ((opcode & 0xF000) >> 12) {
            // 0x0???
            case 0x0: {
                switch (opcode) {
                    // 00E0 - CLS
                    // Clear the display.
                    case 0x00E0: {
                        for (var i = 0, l = display.length; i < l; i++)
                            display[i].rem();
                        break;
                    }
                        // 00EE - RET 
                        // Return from a subroutine.
                    case 0x00EE: {
                        SP--;
                        PC = stack[SP];
                        break;
                    }
                    default: {
                        // console.warn('Unknow opcode:\t0x' + opcode.toString(16));
                        break;
                    }
                        break;
                }
            }
                // 1nnn - JP addr
                // Jump to location nnn.
            case 0x1: {
                PC = opcode & 0x0FFF;
                break;
            }
                // 2nnn - CALL addr
                // Call subroutine at nnn.
            case 0x2: {
                stack[SP] = PC;
                SP++;
                PC = opcode & 0x0FFF;
                break;
            }
                // 3xkk - SE Vx, byte
                // Skip next instruction if Vx == kk.
            case 0x3: {
                if (rV[(opcode & 0x0F00) >> 8] === (opcode & 0x00FF))
                    PC += 2;
                break;
            }
                // 4xkk - SNE Vx, byte
                // Skip next instruction if Vx != kk.
            case 0x4: {
                if (rV[(opcode & 0x0F00) >> 8] !== (opcode & 0x00FF))
                    PC += 2;
                break;
            }
                // 5xy0 - SE Vx, Vy
                // Skip next instruction if Vx == Vy.
            case 0x5: {
                if ((opcode & 0x000F) === 0x0)
                    if (rV[(opcode & 0x0F00) >> 8] === rV[(opcode & 0x00F0) >> 4])
                        PC += 2;
                break;
            }
                // 6xkk - LD Vx, byte
                // Set Vx = kk.
            case 0x6: {
                rV[(opcode & 0x0F00) >> 8] = opcode & 0x00FF;
                break;
            }
                // 7xkk - ADD Vx, byte
                // Set Vx = Vx + kk.
            case 0x7: {
                rV[(opcode & 0x0F00) >> 8] += opcode & 0x00FF;
                break;
            }
                // 8???
            case 0x8: {
                switch (opcode & 0x000F) {
                    // 8xy0 - LD Vx, Vy
                    // Set Vx = Vy.
                    case 0x0:
                        rV[(opcode & 0x0F00) >> 8] = rV[(opcode & 0x00F0) >> 4];
                        break;
                        // 8xy1 - OR Vx, Vy
                        // Set Vx = Vx OR Vy.
                    case 0x1:
                        rV[(opcode & 0x0F00) >> 8] |= rV[(opcode & 0x00F0) >> 4];
                        break;
                        // 8xy2 - AND Vx, Vy
                        // Set Vx = Vx AND Vy.
                    case 0x2:
                        rV[(opcode & 0x0F00) >> 8] &= rV[(opcode & 0x00F0) >> 4];
                        break;
                        // 8xy3 - XOR Vx, Vy
                        // Set Vx = Vx XOR Vy.
                    case 0x3:
                        rV[(opcode & 0x0F00) >> 8] ^= rV[(opcode & 0x00F0) >> 4];
                        break;
                        // 8xy4 - ADD Vx, Vy
                        // Set Vx = Vx + Vy, set VF = carry.
                    case 0x4:
                        rV[(opcode & 0x0F00) >> 8] += rV[(opcode & 0x00F0) >> 4];
                        rV[0xF] = (rV[(opcode & 0x0F00) >> 8] > 255) ? 1 : 0;
                        break;
                        // 8xy5 - SUB Vx, Vy
                        // Set Vx = Vx - Vy, set VF = NOT borrow.
                    case 0x5:
                        rV[(opcode & 0x0F00) >> 8] -= rV[(opcode & 0x00f0) >> 4];
                        rV[0xF] = (rV[(opcode & 0x0F00) >> 8] > rV[(opcode & 0x00F0) >> 4]) ? 1 : 0;
                        break;
                        // 8xy6 - SHR Vx {, Vy}
                        // Set Vx = Vx SHR 1.
                    case 0x6:
                        rV[0xF] = rV[(opcode & 0x0F00) >> 8] & 0x1;
                        rV[(opcode & 0x0F00) >> 8] >>= 1;
                        break;
                        // 8xy7 - SUBN Vx, Vy
                        // Set Vx = Vy - Vx, set VF = NOT borrow.
                    case 0x7:
                        regV[0xF] = (rV[(opcode & 0x00F0) >> 4] >= rV[(opcode & 0x0F00) >> 8]) ? 1 : 0;
                        rV[(opcode & 0x0F00) >> 8] = rV[(opcode & 0x00F0) >> 4] - rV[(opcode & 0x0F00) >> 8];
                        break;
                        // 8xyE - SHL Vx {, Vy}
                        // Set Vx = Vx SHL 1.
                    case 0xe:
                        /* ? */                 rV[0xF] = +(rV[1] & 0x01);
                        rV[(opcode & 0x0F00) >> 8] <<= 1;
                        break;
                    default: {
                        // console.warn('unknow opcode:\t0x'+opcode.toString(16));
                        break;
                    }
                }
                break;
            }
                // 9xy0 - SNE Vx, Vy
                // Skip next instruction if Vx != Vy.
            case 0x9: {
                if (rV[(opcode & 0x0F00) >> 8] !== rV[(opcode & 0x00F0) >> 4])
                    PC += 2;
                break;
            }
                // Annn - LD I, addr
                // Set I = nnn.
            case 0xA: {
                rI = opcode & 0x0FFF;
                break;
            }
                // Bnnn - JP V0, addr
                // Jump to location nnn + V0.
            case 0xB: {
                PC = (opcode & 0x0FFF) + rV[0];
                break;
            }
                // Cxkk - RND Vx, byte
                // Set Vx = random byte AND kk.
            case 0xC: {
                rV[(opcode & 0x0F00) >> 8] = Math.floor(Math.random() * 0xFF) & (opcode & 0x00FF);
                break;
            }
                // Dxyn - DRW Vx, Vy, nibble
                // Display n-byte sprite starting at memory location I at (Vx, Vy), set VF = collision.
            case 0xD: {
                // console.log('draw');
                var sprite = [],
                    x = rV[(opcode & 0x0F00) >> 8],
                    y = rV[(opcode & 0x00F0) >> 4],
                    height = (opcode & 0x000F),
                    width = 8,
                    pos,
                    bit,
                    foo;

                for (var i = 0; i < (opcode & 0x000F) ; i++) {
                    sprite.push(memory[rI + i]);
                }

                rV[0xF] = 0;

                for (var iH = 0; iH < height; iH++) {
                    for (var iW = width - 1; iW >= 0; iW--) {
                        pos = (y + iH) * 64 + (x + iW);
                        bit = sprite[iH] & 0x1;
                        if ((sprite[iH] & 0x1) !== 0) {
                            if (display[pos].isActive())
                                rV[0xF] = 1;
                            foo = display[pos].isActive() ^ true;
                        }
                        if (foo) {
                            display[pos].add();
                        }
                        else display[pos].rem();
                        sprite[iH] >>= 1;
                    }
                }


                /*

case 0xD000:		   
{
  unsigned short x = V[(opcode & 0x0F00) >> 8];
  unsigned short y = V[(opcode & 0x00F0) >> 4];
  unsigned short height = opcode & 0x000F;
  unsigned short pixel;
 
  V[0xF] = 0;
  for (int yline = 0; yline < height; yline++)
  {
    pixel = memory[I + yline];
    for(int xline = 0; xline < 8; xline++)
    {
      if((pixel & (0x80 >> xline)) != 0)
      {
        if(gfx[(x + xline + ((y + yline) * 64))] == 1)
          V[0xF] = 1;                                 
        gfx[x + xline + ((y + yline) * 64)] ^= 1;
      }
    }
  }
 
  drawFlag = true;
  pc += 2;
}
break;

                */











                break;
            }
            case 0xE: {
                // E???
                switch (opcode & 0x00FF) {
                    // Ex9E - SKP Vx
                    // Skip next instruction if key with the value of Vx is pressed.
                    case 0x9E:
                        /*
						
						*/
                        break;
                        // ExA1 - SKNP Vx
                        // Skip next instruction if key with the value of Vx is not pressed.
                    case 0xA1:
                        /*
						
						*/
                        PC += 2;
                        break;
                }
                break;
            }
            case 0xF: {
                switch (opcode & 0x00FF) {
                    // FFx07 - LD Vx, DT
                    // Set Vx = delay timer value.
                    case 0x07:
                        rV[(opcode & 0x0F00) >> 8] = delayTimer;
                        break;
                        // Fx0A - LD Vx, K
                        // Wait for a key press, store the value of the key in Vx.
                    case 0x0a:
                        /*
						
						*/
                        break;
                        // Fx15 - LD DT, Vx
                        // Set delay timer = Vx.
                    case 0x15:
                        delayTimer = rV[(opcode & 0x0F00) >> 8];
                        break;
                        // Fx18 - LD ST, Vx
                        // Set sound timer = Vx.
                    case 0x18:
                        soundTimer = rV[(opcode & 0x0F00) >> 8];
                        break;
                        // Fx1E - ADD I, Vx
                        // Set I = I + Vx.
                    case 0x1e:
                        rI += rV[(opcode & 0x0F00) >> 8];
                        break;
                        // Fx29 - LD F, Vx
                        // Set I = location of sprite for digit Vx.
                    case 0x29:
                        rI = rV[(opcode & 0x0F00) >> 8] * 0x5;
                        break;
                        // Fx33 - LD B, Vx
                        // Store BCD representation of Vx in memory locations I, I+1, and I+2.
                    case 0x33:
                        memory[rI] = rV[(opcode & 0x0F00) >> 8] / 100;
                        memory[rI + 1] = (rV[(opcode & 0x0F00) >> 8] / 10) % 10;
                        memory[rI + 2] = rV[(opcode & 0x0F00) >> 8] % 10;
                        break;
                        // Fx55 - LD [I], Vx
                        // Store registers V0 through Vx in memory starting at location I.
                    case 0x55:
                        for (var i = 0; i <= ((opcode & 0x0F00) >> 8) ; i++)
                            memory[rI + i] = rV[i];
                        break;
                        // Fx65 - LD Vx, [I]
                        // Read registers V0 through Vx from memory starting at location I.
                    case 0x65:
                        for (var i = 0; i <= ((opcode & 0x0F00) >> 8) ; i++)
                            rV[i] = memory[rI + i];
                        break;
                }
                break;
            }
            default: {
                console.warn('unknow opcode:\t0x' + opcode.toString(16));
                break;
            }
        }
    }


    this.loadRom = function (romData) {
        initialization();
        if (romData) {
            if (romData.length > (memory.length - 0x200)) {
                console.error('Selected rom is too large');
                //return 0;
            }
            else {
                memory.set(romData, PC);
                //return 1;
            }
        }
    }

}