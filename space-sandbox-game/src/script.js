    const canvas = document.getElementById("universe");
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let seed = Math.floor(Math.random() * 1000000000);
    let offsetX = canvas.width / 2;
    let offsetY = canvas.height / 2;
    let zoom = 1;
    let dragging = false;
    let dragStart = {x: 0, y: 0};
    let selectedStar = null;
    let rightClickStar = null;
    let isTyping = false;
    let tick = 0;
    let starCache = {};
    let nameRegistry = {};
    let developerModeActive = false;
    let mousePos = { x: 0, y: 0 };
    let credits = 0;

    let gameDay = 1;
    let gameMonth = 1;
    let gameYear = 2253;
    let timePaused = true;
    let timeAccumulator = 0;

    let timeSpeed = 1; // 1x padrão
    const timeSpeeds = [1, 2, 5];
    const timeSpeedLabels = ["1x", "2x", "5x"];
    let timeButtonRects = []; // Para detectar clique

    // Adicione variáveis para o console e comandos
    let devLogs = [];
    let devCommand = "";
    let devCommandHistory = [];
    let devCommandHistoryIndex = -1;

    let initialSelectionActive = true;
    let initialSelectedStar = null;
    let initialSelectedPlanet = null;

    let playerStartSystem = null;
    let playerStartPlanet = null;
    let playerSystemX = null;
    let playerSystemY = null;
    let playerShips = [];
    let activeShip = null;

    let cameraAnimating = false;
    let cameraStartX = 0;
    let cameraStartY = 0;
    let cameraTargetX = 0;
    let cameraTargetY = 0;
    let cameraAnimationProgress = 0;
    let cameraAnimationDuration = 1000;

    let targetZoom = 1;
    let zoomAnimationFrame;

    const shipClasses = {
      exploradora: {
        name: "Exploradora",
        ships: [
          { name: "Explorador Mk1", hull: 50, size: 1, speed: 8, cargo: 10, crew: 2, cost: 1000 },
          { name: "Explorador Mk2", hull: 75, size: 1, speed: 10, cargo: 15, crew: 3, cost: 2500 },
          { name: "Explorador Mk3", hull: 100, size: 2, speed: 12, cargo: 20, crew: 4, cost: 5000 }
        ]
      },
      caca: {
        name: "Caça",
        ships: [
          { name: "Caça Mk1", hull: 40, size: 1, speed: 15, cargo: 5, crew: 1, cost: 1500 },
          { name: "Caça Mk2", hull: 60, size: 1, speed: 18, cargo: 8, crew: 1, cost: 3000 },
          { name: "Caça Mk3", hull: 80, size: 2, speed: 20, cargo: 10, crew: 2, cost: 6000}
        ]
      },
      fragata: {
        name: "Fragata",
        ships: [
          { name: "Fragata Mk1", hull: 120, size: 2, speed: 6, cargo: 25, crew: 8, cost: 4000 },
          { name: "Fragata Mk2", hull: 180, size: 3, speed: 7, cargo: 35, crew: 12, cost: 8000 },
          { name: "Fragata Mk3", hull: 250, size: 4, speed: 8, cargo: 50, crew: 16, cost: 15000 }
        ]
      },
      cargueira: {
        name: "Cargueira",
        ships: [
          { name: "Cargueira Mk1", hull: 80, size: 2, speed: 4, cargo: 100, crew: 8, cost: 3000 },
          { name: "Cargueira Mk2", hull: 120, size: 3, speed: 5, cargo: 200, crew: 15, cost: 7000 },
          { name: "Cargueira Mk3", hull: 200, size: 4, speed: 6, cargo: 400, crew: 25, cost: 12000 }
        ]
      },
      destroier: {
        name: "Destróier",
        ships: [
          { name: "Destróier Mk1", hull: 200, size: 3, speed: 5, cargo: 30, crew: 15, cost: 8000 },
          { name: "Destróier Mk2", hull: 350, size: 4, speed: 6, cargo: 50, crew: 25, cost: 18000 },
          { name: "Destróier Mk3", hull: 500, size: 5, speed: 7, cargo: 75, crew: 35, cost: 35000 }
        ]
      }
    };

    function pseudoRandom(x) {
      x = Math.sin(x * 999) * 10000;
      return x - Math.floor(x);
    }

    function hashString(str) {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
      }
      return hash;
    }

    function generateName(seed) {
      // Sílabas balanceadas para nomes mais bonitos
      const consoantes = [
        "b", "c", "d", "f", "g", "h", "j", "k", "l", "m", "n", "p", "r", "s", "t", "v", "w", "x", "z",
        "ch", "sh", "th", "br", "cr", "dr", "fr", "gr", "pr", "tr", "bl", "cl", "fl", "gl", "st", "sk"
      ];
      const vogais = [
        "a", "e", "i", "o", "u", "ae", "io", "ou", "ai", "ei", "au", "ia", "oa", "ui"
      ];
      const sufixos = ["on", "ar", "es", "us", "ium", "os", "is", "ea", "or", "ax", "ex", "ion"];
      const prefixos = ["Al", "Bel", "Cor", "Dor", "El", "Fal", "Gal", "Hel", "Jar", "Kel", "Lor", "Mor", "Nor", "Pal", "Quel", "Ral", "Sel", "Tor", "Val", "Xel", "Yar", "Zor"];

      // Determina o tipo de nome baseado na seed
      const nameType = pseudoRandom(seed + 12345);

      let name = "";

      if (nameType < 0.001) {
        // 0.1% Nomes muito longos e exóticos 
        const parts = 4 + Math.floor(pseudoRandom(seed + 1) * 3);
        for (let i = 0; i < parts; i++) {
          const cIndex = Math.floor(pseudoRandom(seed + i * 99 + 1000) * consoantes.length);
          const vIndex = Math.floor(pseudoRandom(seed + i * 999 + 2000) * vogais.length);
          name += consoantes[cIndex] + vogais[vIndex];
        }
        if (pseudoRandom(seed + 5678) > 0.6) {
          name += sufixos[Math.floor(pseudoRandom(seed + 8765) * sufixos.length)];
        }
      } else if (nameType < 0.3) {
        // 30% Nomes curtos e simples (2 sílabas)
        const parts = 2;
        for (let i = 0; i < parts; i++) {
          const cIndex = Math.floor(pseudoRandom(seed + i * 99 + 1000) * consoantes.length);
          const vIndex = Math.floor(pseudoRandom(seed + i * 999 + 2000) * vogais.length);
          name += consoantes[cIndex] + vogais[vIndex];
        }
      } else if (nameType < 0.7) {
        // 40% Nomes médios com hífen
        const parts1 = 1 + Math.floor(pseudoRandom(seed + 1) * 2); // 1-2 sílabas
        const parts2 = 1 + Math.floor(pseudoRandom(seed + 2) * 2); // 1-2 sílabas
        
        let part1 = "";
        let part2 = "";
        
        for (let i = 0; i < parts1; i++) {
          const cIndex = Math.floor(pseudoRandom(seed + i * 99 + 1000) * consoantes.length);
          const vIndex = Math.floor(pseudoRandom(seed + i * 999 + 2000) * vogais.length);
          part1 += consoantes[cIndex] + vogais[vIndex];
        }
        for (let i = 0; i < parts2; i++) {
          const cIndex = Math.floor(pseudoRandom(seed + i * 99 + 3000) * consoantes.length);
          const vIndex = Math.floor(pseudoRandom(seed + i * 999 + 4000) * vogais.length);
          part2 += consoantes[cIndex] + vogais[vIndex];
        }
        if (pseudoRandom(seed + 5678) > 0.5) {
          part2 += sufixos[Math.floor(pseudoRandom(seed + 8765) * sufixos.length)];
        }

        name = part1 + "-" + part2;
      } else {
        // 30% Nomes médios sem hífen (2-3 sílabas)
        const parts = 2 + Math.floor(pseudoRandom(seed + 1) * 2); // 2-3 sílabas
        
        // Prefixo ocasional
        if (pseudoRandom(seed + 1234) > 0.8) {
          name += prefixos[Math.floor(pseudoRandom(seed + 4321) * prefixos.length)];
        }

        for (let i = 0; i < parts; i++) {
          const cIndex = Math.floor(pseudoRandom(seed + i * 99 + 1000) * consoantes.length);
          const vIndex = Math.floor(pseudoRandom(seed + i * 999 + 2000) * vogais.length);
          name += consoantes[cIndex] + vogais[vIndex];
        }
        
        // Sufixo ocasional
        if (pseudoRandom(seed + 5678) > 0.7) {
          name += sufixos[Math.floor(pseudoRandom(seed + 8765) * sufixos.length)];
        }
      }

      // Capitaliza adequadamente
      name = name
        .split("-")
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join("-");
      
      nameRegistry[name] = true;
      return name;
    }

    function generatePlanetName(starSeed, planetIndex) {
      const planetSeed = starSeed + planetIndex * 777 + 12345;
      
      // Tipos de nomes para planetas
      const nameType = pseudoRandom(planetSeed);
      
      if (nameType < 0.4) {
        // 40% - Nomes com números romanos (ex: "Kepler IV", "Zephyr II")
        const baseName = generateName(planetSeed);
        const romanNumerals = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
        const romanIndex = Math.min(planetIndex, romanNumerals.length - 1);
        return `${baseName} ${romanNumerals[romanIndex]}`;
      } else if (nameType < 0.7) {
        // 30% - Nomes com sufixos planetários
        const planetSuffixes = ["Prime", "Major", "Minor", "Alpha", "Beta", "Gamma", "Delta", "Epsilon"];
        const baseName = generateName(planetSeed);
        const suffixIndex = Math.floor(pseudoRandom(planetSeed + 999) * planetSuffixes.length);
        return `${baseName} ${planetSuffixes[suffixIndex]}`;
      } else {
        // 30% - Nomes únicos para cada planeta
        return generateName(planetSeed);
      }
    }

    function selectInitialPlanet(idx) {
      if (!initialSelectedStar) return;
      initialSelectedPlanet = initialSelectedStar.planets[idx];
      document.getElementById("startSelectionConfirm").innerHTML = `
        <div style="margin-top:10px;">
          <b>Confirmar início em: </b><br>
          <span style="color:#0ef;">${initialSelectedStar.name} - ${initialSelectedPlanet}</span><br>
          <button style="margin:8px 4px;padding:8px 24px;background:#0ef;color:#222;border:none;border-radius:6px;font-weight:bold;cursor:pointer;" onclick="confirmInitialSelection()">Confirmar</button>
        </div>
        `;
    }
    window.selectInitialPlanet = selectInitialPlanet;

    function confirmInitialSelection() {

      if (initialSelectedStar) {
        // Define o sistema e planeta iniciais
        playerStartSystem = initialSelectedStar.name;
        playerStartPlanet = initialSelectedPlanet;

        // Salva as coordenadas do sistema
        playerSystemX = initialSelectedStar.x;
        playerSystemY = initialSelectedStar.y;

        // Centraliza a câmera no sistema/planeta escolhido
        offsetX = canvas.width / 2 - initialSelectedStar.x * zoom;
        offsetY = canvas.height / 2 - initialSelectedStar.y * zoom;
        // Você pode guardar o planeta inicial em uma variável se quiser
      }
      document.getElementById("startSelectionBox").style.display = "none";
      initialSelectionActive = false;
    }
    window.confirmInitialSelection = confirmInitialSelection;

    function cancelInitialSelection() {
      // Permite escolher outro sistema
      initialSelectedStar = null;
      initialSelectedPlanet = null;
      document.getElementById("startSelectionText").innerHTML =  "Escolha um local para começar.";
      document.getElementById("startSelectionPlanets").innerHTML = "";
      document.getElementById("startSelectionConfirm").innerHTML = "";
    }
    window.cancelInitialSelection = cancelInitialSelection;

    function filteredStarColor(seed) {
      const rarity = pseudoRandom(seed);
      if (rarity < 0.5) {
      // Orange stars (most common)
      const r = 220 + Math.floor(pseudoRandom(seed) * 50);
      const g = 100 + Math.floor(pseudoRandom(seed + 1) * 100);
      const b = Math.floor(pseudoRandom(seed + 2) * 50);
      return `rgb(${r},${g},${b})`;
      } else if (rarity < 0.75) {
      // Yellow stars
      const r = 240 + Math.floor(pseudoRandom(seed) * 15);
      const g = 200 + Math.floor(pseudoRandom(seed + 1) * 55);
      const b = Math.floor(pseudoRandom(seed + 2) * 50);
      return `rgb(${r},${g},${b})`;
      } else if (rarity < 0.959) {
      // Red stars
      const r = 200 + Math.floor(pseudoRandom(seed) * 55);
      const g = Math.floor(pseudoRandom(seed + 1) * 50);
      const b = Math.floor(pseudoRandom(seed + 2) * 50);
      return `rgb(${r},${g},${b})`;
      } else if (rarity < 0.999) {
      // Blue-white stars
      const r = 80 + Math.floor(pseudoRandom(seed) * 55);
      const g = 180 + Math.floor(pseudoRandom(seed + 1) * 35);
      const b = 255;
      return `rgb(${r},${g},${b})`;
      } else {
      // Purple stars (rarest)
      const r = 200 + Math.floor(pseudoRandom(seed) * 50);
      const g = 100 + Math.floor(pseudoRandom(seed + 1) * 50);
      const b = 255;
      return `rgb(${r},${g},${b})`;
      }
    }

    // Função para animar a câmera suavemente
    function animateCameraTo(worldX, worldY) {
      if (cameraAnimating) return;
      
      cameraAnimating = true;
      cameraStartX = offsetX;
      cameraStartY = offsetY;
      cameraTargetX = canvas.width / 2 - worldX * zoom;
      cameraTargetY = canvas.height / 2 - worldY * zoom;
      cameraAnimationProgress = 0;

      const startTime = performance.now();

      function animateStep(currentTime) {
        const elapsed = currentTime - startTime;
        cameraAnimationProgress = Math.min(elapsed / cameraAnimationDuration, 1);

        // Easing suave (ease-out)
        const easeProgress = 1 - Math.pow(1 - cameraAnimationProgress, 1);

        offsetX = cameraStartX + (cameraTargetX - cameraStartX) * easeProgress;
        offsetY = cameraStartY + (cameraTargetY - cameraStartY) * easeProgress;

        if (cameraAnimationProgress < 1) {
          requestAnimationFrame(animateStep);
        } else {
          cameraAnimating = false;
        }
      }

      requestAnimationFrame(animateStep);
    }

    function goToPlayerSystem() {
      if (playerSystemX !== null && playerSystemY !== null) {
        animateCameraTo(playerSystemX, playerSystemY);
      }
    }

    // Generate a chunk of stars based on the seed and chunk coordinates
    function generateChunk(chunkX, chunkY) {
      const stars = [];
      const chunkSeed = hashString(seed + "_" + chunkX + "_" + chunkY);
      for (let i = 0; i < 40; i++) {
        const localSeed = chunkSeed + i * 9999;
        const x = chunkX * 1000 + pseudoRandom(localSeed) * 1000 + (pseudoRandom(localSeed + 5) - 0.5) * 500;
        const y = chunkY * 1000 + pseudoRandom(localSeed + 1) * 1000 + (pseudoRandom(localSeed + 6) - 0.5) * 500;
        const name = generateName(localSeed);
        const color = filteredStarColor(localSeed);
        const size = 2 + pseudoRandom(localSeed + 2) * 2.5;

        // Número de planetas depende do tamanho da estrela (quanto maior, mais planetas)
        const minPlanets = 1;
        const maxPlanets = 20;
        const planetCount = minPlanets + Math.floor((size / 4.5) * (maxPlanets - minPlanets + 1) * pseudoRandom(localSeed + 7));
        const planets = [];
        for (let p = 0; p < planetCount; p++) {
          planets.push(generatePlanetName(localSeed, p));
        }

        stars.push({ x, y, name, color, size, planets });
      }
      return stars;
    }

    function drawUniverse() {
      tick++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const viewLeft = screenToWorld(0, 0).x;
      const viewRight = screenToWorld(canvas.width, 0).x;
      const viewTop = screenToWorld(0, 0).y;
      const viewBottom = screenToWorld(0, canvas.height).y;

      // Extend the range slightly
      const minChunkX = Math.floor(viewLeft / 1000) - 1;
      const maxChunkX = Math.floor(viewRight / 1000) + 1;
      const minChunkY = Math.floor(viewTop / 1000) - 1;
      const maxChunkY = Math.floor(viewBottom / 1000) + 1;

      let stars = [];
      for (let cx = minChunkX; cx <= maxChunkX; cx++) {
      for (let cy = minChunkY; cy <= maxChunkY; cy++) {
        const key = `${cx},${cy}`;
        if (!starCache[key]) {
        starCache[key] = generateChunk(cx, cy);
        }
        stars = stars.concat(starCache[key]);
      }
      }

      // Desenha círculo ao redor da estrela que está o jogador
      if (playerStartSystem) {
        for (const star of stars) {
          if (star.name === playerStartSystem) {
            const screenX = star.x * zoom + offsetX;
            const screenY = star.y * zoom + offsetY;
            
            // Verifica se está visível na tela
            if (screenX > -50 && screenX < canvas.width + 50 && 
                screenY > -50 && screenY < canvas.height + 50) {
              
              // Animação do círculo
              const time = tick * 0.009; // Velocidade da rotação
              const baseRadius = (star.size + 15) * zoom;
              const radiusOscillation = Math.sin(time * 2) * 2 * zoom; // Oscilação do tamanho
              const radius = baseRadius + radiusOscillation;
              
              ctx.save();
              ctx.strokeStyle = "#00eaff";
              ctx.lineWidth = 1;
              ctx.globalAlpha = 0.6 + Math.sin(time * 3) * 0.2; // Oscilação da transparência
              
              // Desenha círculo rotativo (efeito de movimento)
              ctx.beginPath();
              ctx.setLineDash([8, 4]); // Linha tracejada
              ctx.lineDashOffset = -time * 10; // Rotação da linha tracejada
              ctx.arc(screenX, screenY, radius, 0, Math.PI * 2);
              ctx.stroke();
              
              ctx.restore();
            }
            break;
          }
        }
      }

      for (const star of stars) {
      const screenX = star.x * zoom + offsetX;
      const screenY = star.y * zoom + offsetY;

      // Only draw stars that are within the visible screen bounds
      if (
        screenX + star.size > 0 &&
        screenX - star.size < canvas.width &&
        screenY + star.size > 0 &&
        screenY - star.size < canvas.height
      ) {
        const pulse = 0.5 + Math.sin(tick * 0.1 + star.x + star.y) * 0.5;
        ctx.beginPath();
        ctx.fillStyle = star.color;
        ctx.globalAlpha = 0.5 + pulse * 0.3;
        ctx.arc(screenX, screenY, star.size + pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      }

      // Painel de recursos
      ctx.save();
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = "rgba(20, 20, 40, 1)";
      ctx.fillRect(15, 15, 160, 36);
      ctx.globalAlpha = 1;
      ctx.font = "bold 22px monospace";
      ctx.fillStyle = "#00eaff";
      ctx.fillText(`Cr: ${credits}`, 30, 40);
      ctx.restore();

      // Painel de data
      ctx.save();
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = "rgba(20, 20, 40, 1)";
      ctx.fillRect(15, 60, 160, 36);
      ctx.globalAlpha = 1;
      ctx.font = "bold 22px monospace";
      ctx.fillStyle = "#00eaff";
      const dia = String(gameDay).padStart(2, "0");
      const mes = String(gameMonth).padStart(2, "0");
      ctx.fillText(`${dia}/${mes}/${gameYear}`, 30, 85);
      ctx.restore();

      // Painel do sistema inicial
      if (playerStartSystem) {
        ctx.save();
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = "rgba(20, 20, 40, 1)"
        ctx.fillRect(canvas.width - 180, 15, 165, 50);
        ctx.globalAlpha = 1;
        ctx.font = "bold 16px monospace";
        ctx.fillStyle = "#00eaff";
        ctx.textAlign = "right";
        ctx.fillText(playerStartSystem, canvas.width - 80, 35);
        ctx.font = "12px monospace";
        ctx.fillText(playerStartPlanet, canvas.width - 80, 50);
        ctx.restore();
      }

      // Painel da nave ativa
      if (activeShip) {
        ctx.save();
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = "rgba(20, 20, 40, 1)";
        ctx.fillRect(canvas.width - 200, 75, 185, 65);
        ctx.globalAlpha = 1;
        ctx.font = "bold 14px monospace";
        ctx.fillStyle = "#00eaff";
        ctx.textAlign = "right";
        ctx.fillText(activeShip.name, canvas.width - 20, 95);
        ctx.font = "11px monospace";
        ctx.fillText(`${shipClasses[activeShip.className].name}`, canvas.width - 20, 110);
        ctx.fillText(`Casco: ${activeShip.currentHull}/${activeShip.hull}`, canvas.width - 20, 125);
        ctx.fillText(`Tripulação: ${activeShip.currentCrew}/${activeShip.maxCrew}`, canvas.width - 20, 140);
        ctx.restore();
      }

      // Botões de velocidade do tempo
      timeButtonRects = [];
      const btnY = 105;
      const btnW = 48;
      const btnH = 32;
      const btnSpacing = 6;
      for (let i = 0; i < 3; i++) {
        const x = 15 + i * (btnW + btnSpacing);
        ctx.save();
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = (timeSpeed === timeSpeeds[i]) ? "#00eaff" : "rgba(20, 20, 40, 1)";
        ctx.fillRect(x, btnY, btnW, btnH);
        ctx.globalAlpha = 1;
        ctx.strokeStyle = "#00eaff";
        ctx.lineWidth = 2;
        ctx.strokeRect(x, btnY, btnW, btnH);
        ctx.font = "bold 18px monospace";
        ctx.fillStyle = (timeSpeed === timeSpeeds[i]) ? "#222" : "#00eaff";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(timeSpeedLabels[i], x + btnW / 2, btnY + btnH / 2);
        ctx.restore();
        timeButtonRects.push({x, y: btnY, w: btnW, h: btnH, speed: timeSpeeds[i]});
      }

      // Developer mode: draw grid
      if (developerModeActive) {
        highlightChunkUnderMouse();
      }

      // Modo desenvolvedor: informações extras
      if (developerModeActive) {
        // 1. Exibe coordenadas do mouse, chunk, zoom
        ctx.save();
        ctx.font = "14px monospace";
        ctx.fillStyle = "#0ff";
        ctx.globalAlpha = 0.85;
        const world = screenToWorld(mousePos.x, mousePos.y);
        const chunkX = Math.floor(world.x / 1000);
        const chunkY = Math.floor(world.y / 1000);
        ctx.fillText(
          `Mouse: (${world.x.toFixed(1)}, ${world.y.toFixed(1)}) | Chunk: (${chunkX}, ${chunkY}) | Zoom: ${zoom.toFixed(2)}`,
          10,
          canvas.height - 90
        );
        // 2. Exibe informações detalhadas da estrela sob o mouse
        const star = findStarAt(mousePos.x, mousePos.y);
        if (star) {
          ctx.fillText(
            `Estrela: ${star.name} | Planetas: ${star.planets.length}`,
            10,
            canvas.height - 70
          );
        }
        ctx.restore();

        // 3. Console de logs
        ctx.save();
        ctx.globalAlpha = 0.85;
        ctx.fillStyle = "rgba(20,20,40,0.95)";
        // Suba o painel para não cobrir as infos do cursor
        ctx.fillRect(10, canvas.height - 340, 400, 120);
        ctx.strokeStyle = "#00eaff";
        ctx.lineWidth = 2;
        ctx.strokeRect(10, canvas.height - 340, 400, 120);
        ctx.font = "13px monospace";
        ctx.fillStyle = "#fff";
        for (let i = 0; i < devLogs.length; i++) {
          ctx.fillText(devLogs[i], 18, canvas.height - 320 + i * 13);
        }
        // Campo de comando
        ctx.fillStyle = "#00eaff";
        ctx.fillText("> " + devCommand + (tick % 60 < 30 ? "_" : ""), 18, canvas.height - 195);
        ctx.restore();
      }
    }

    // Atualiza o tempo do jogo (1 dia a cada 0.5s / speed)
    function updateGameTime(dt) {
      if (timePaused) return;
      timeAccumulator += dt * timeSpeed;
      while (timeAccumulator >= 500) { // 500 ms = 1 dia
        timeAccumulator -= 500;
        gameDay++;
        if (gameDay > 30) {
          gameDay = 1;
          gameMonth++;
          if (gameMonth > 12) {
            gameMonth = 1;
            gameYear++;
          }
        }
      }
    }

    // Function to highlight the chunk under the mouse cursor
    function highlightChunkUnderMouse() {
      const world = screenToWorld(mousePos.x, mousePos.y);
      const chunkX = Math.floor(world.x / 1000);
      const chunkY = Math.floor(world.y / 1000);
      const left = chunkX * 1000 * zoom + offsetX;
      const top = chunkY * 1000 * zoom + offsetY;
      const size = 1000 * zoom;

      ctx.save();
      ctx.strokeStyle = "blue";
      ctx.lineWidth = 3;
      ctx.globalAlpha = 0.5;
      ctx.strokeRect(left, top, size, size);
      ctx.globalAlpha = 1;
      ctx.restore();
    }

    function screenToWorld(x, y) {
      return {
      x: (x - offsetX) / zoom,
      y: (y - offsetY) / zoom
      };
    }

    function findStarAt(x, y) {
      const world = screenToWorld(x, y);
      const chunkX = Math.floor(world.x / 1000);
      const chunkY = Math.floor(world.y / 1000);
      const detectionRadius = 10 / zoom;
      // Check the current chunk and its neighbors
      for  (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const key = `${chunkX + dx}, ${chunkY + dy}`;
          const chunk = starCache[key] || generateChunk(chunkX + dx, chunkY + dy);
          const found = chunk.find(s => Math.hypot(s.x - world.x, s.y - world.y) < detectionRadius);
          if (found) return found;
        }
      }
      return null;
    }

    function showStarInfo(star, x, y) {
      const panel = document.getElementById("starPanel");
      panel.style.left = `${x + 15}px`;
      panel.style.top = `${y}px`;
      panel.innerHTML = `
        <div style="font-size: 16px; font-weight: bold; color: #00eaff; margin-bottom: 8px;">${star.name}</div>
        <div style="font-size: 12px; color: #ccc; margin-bottom: 12px;">
          Coordenadas: (${Math.round(star.x)}, ${Math.round(star.y)})<br>
        </div>
        <button id="planetsBtn" style="background:#222;color:#00eaff;border:1px solid #00eaff;border-radius:4px;padding:8px 16px;font-size:14px;font-weight:bold;cursor:pointer;transition:all 0.2s ease;font-family:monospace;">Planetas: (${star.planets.length})</button>
      `;
      panel.style.display = "block";

      // Evento para mostrar/ocultar planetas
      document.getElementById("planetsBtn").onclick = () => {
        togglePlanetsList(star);
      };

      const btn = document.getElementById("planetsBtn");
      btn.onmouseover = () => {
        btn.style.background = "#00eaff";
        btn.style.color = "#222";
      };
      btn.onmouseleave = () => {
        btn.style.background = "#222";
        btn.style.color = "#00eaff";
      }
    }

    function togglePlanetsList(star) {
      let planetsPanel = document.getElementById("planetsPanel");

      if (planetsPanel) {
        // Remove o listener antes de remover o painel
        document.removeEventListener("click", closePlanetsPanel);
        // Se o painel já existe, remove com animação
        planetsPanel.style.transform = "translateY(-20px)";
        planetsPanel.style.opacity = "0";
        setTimeout(() => {
          planetsPanel.remove();
        }, 200);
        return;
      }

      // Pega a posição do painel de estrela para posicionar os planetas
      const starPanel = document.getElementById("starPanel");
      const starRect = starPanel.getBoundingClientRect();
      const originalX = starRect.left;
      const originalY = starRect.top;

      // Cria o painel de planetas
      planetsPanel = document.createElement("div");
      planetsPanel.id = "planetsPanel";
      planetsPanel.style.cssText = `
        position: fixed;
        left: ${originalX + 180}px;
        top: ${originalY}px;
        background: rgba(20, 20, 40, 0.95);
        border: 1px solid #00eaff;
        border-radius: 6px;
        padding: 12px;
        max-width: 200px;
        max-height: 300px;
        overflow-y: auto;
        font-family: monospace;
        font-size: 12px;
        z-index: 1001;
        box-shadow: 0 4px 12px rgba(0, 234, 255, 0.3);
        transform: translateY(-20px);
        opacity: 0;
        transition: all 0.3s ease;
      `;

      // Adiciona o título
      const title = document.createElement("div");
      title.style.cssText = `
        font-size: 14px;
        font-weight: bold;
        color: #00eaff;
        margin-bottom: 8px;
        text-align: center;
        border-bottom: 1px solid #00eaff;
        padding-bottom: 6px;
      `;
      title.textContent = `Planetas de ${star.name}`;
      planetsPanel.appendChild(title);

      // Adiciona a lista de planetas
      const planetsList = document.createElement("div");
      star.planets.forEach((planet, index) => {
        const planetDiv = document.createElement("div");
        planetDiv.style.cssText = `
          padding: 6px 8px;
          margin: 4px 0;
          background: rgba(0, 234, 255, 0.1);
          border-radius: 4px;
          color: #ccc;
          cursor: pointer;
          transition: all 0.2s ease;
          border-left: 3px solid #00eaff;
        `;
        planetDiv.textContent = `${index + 1}. ${planet}`;

        // Efeito hover
        planetDiv.onmouseover = () => {
          planetDiv.style.background = "rgba(0, 234, 255, 0.2)";
          planetDiv.style.color = "#fff";
        };
        planetDiv.onmouseleave = () => {
          planetDiv.style.background = "rgba(0, 234, 255, 0.1)";
          planetDiv.style.color = "#ccc";
        };

        planetsList.appendChild(planetDiv);

        function closePlanetsPanel(event) {
          if (!planetsPanel.contains(event.target) && event.target.id !== "planetsBtn") {
            planetsPanel.style.transform = "translateY(-20px)";
            planetsPanel.style.opacity = "0";
            setTimeout(() => {
              planetsPanel.remove();
            }, 200);
            document.removeEventListener("click", closePlanetsPanel);
          }
        }
      });

      planetsPanel.appendChild(planetsList);
      document.body.appendChild(planetsPanel);
      function closePlanetsPanel(event) {
        if (!planetsPanel.contains(event.target) && 
            !document.getElementById("planetsBtn").contains(event.target)) {
          planetsPanel.style.transform = "translateY(-20px)";
          planetsPanel.style.opacity = "0";
          setTimeout(() => {
            planetsPanel.remove();
            document.removeEventListener("click", closePlanetsPanel);
          }, 200);
        }
      }
      
      setTimeout(() => {
        document.addEventListener("click", closePlanetsPanel);
      }, 100);

      // Verifica se o painel saiu da tela e ajusta a posição
      setTimeout(() => {
        const rect = planetsPanel.getBoundingClientRect();
        if (rect.right > window.innerWidth) {
          planetsPanel.style.left = `${originalX - 215}px`;
        }
        if (rect.bottom > window.innerHeight) {
          planetsPanel.style.top = `${window.innerHeight - rect.height - 10}px`;
        }

        planetsPanel.style.transform = "translateY(0)";
        planetsPanel.style.opacity = "1";
      }, 50);
    }

    // Função para adicionar logs ao console
    function devLog(msg) {
      devLogs.push(`[${new Date().toLocaleTimeString()}] ${msg}`);
      if (devLogs.length > 10) devLogs.shift();
    }

    // Função para processar comandos
    function processDevCommand(cmd) {
      const args = cmd.trim().split(" ");
      if (args[0] === "addCredits" && args[1]) {
        credits += parseInt(args[1]);
      } else if (args[0] === "goto" && args[1] && args[2]) {
        offsetX = canvas.width / 2 - parseFloat(args[1]) * zoom;
        offsetY = canvas.height / 2 - parseFloat(args[2]) * zoom;
      } else if (args[0] === "regen") {
        starCache = {};
        devLog("Universo regenerado.");
      } else if (args[0] === "clear") {
        devLogs = [];
      } else if (args[0] === "findStar" && args[1]) {
        const starName = args.slice(1).join(" ").toLowerCase();
        let found = null;
        // Procura em todos os chunks carregados
        for (const key in starCache) {
          for (const star of starCache[key]) {
            if (star.name.toLowerCase() === starName) {
              found = star;
              break;
            }
          }
          if (found) break;
        }
        if (found) {
          // Centraliza a câmera na estrela encontrada
          offsetX = canvas.width / 2 - found.x * zoom;
          offsetY = canvas.height  / 2 - found.y * zoom;
          showStarInfo(found, canvas.width / 2, canvas.height / 2);
          devLog(`Sistema encontrado: ${found.name}`);
        } else {
          devLog(`Sistema não encontrado nos chunks carregados.`);
        }
      } else if (args[0] === "addShip" && args[1] && args[2]) {
          const className = args[1];
          const shipIndex = parseInt(args[2]);
          if (shipClasses[className] && shipClasses[className].ships[shipIndex]) {
            const newShip = createShip(className, shipIndex);
            newShip.location = playerStartSystem || "Unknown";
            newShip.currentCrew = newShip.maxCrew;
            playerShips.push(newShip);
            devLog(`Nave adicionada: ${newShip.name}`);
          } else {
            devLog("Classe ou índice de nave inválido");
          }
        } else if (args[0] === "listShips") {
          devLog(`Naves: ${playerShips.length}`);
          for (const ship of playerShips) {
            devLog(`- ${ship.name} (${shipClasses[ship.className].name})`);
          }
        } else if (args[0] === "repairShip") {
          if (activeShip) {
            activeShip.currentHull = activeShip.hull;
            devLog(`${activeShip.name} reparada`);
          } else {
            devLog("Nenhuma nave ativa");
          }
        } else {
        devLog("Comando desconhecido.");
      }
    }

    canvas.addEventListener("mousedown", e => {
      mousePos.x = e.clientX;
      mousePos.y = e.clientY;

      if (initialSelectionActive) {
        // Durante seleção inicial, permite clicar em estrelas
        const star = findStarAt(e.clientX, e.clientY);
        if (star) {
          initialSelectedStar = star;
          document.getElementById("startSelectionText").innerHTML = `
            <b>Sistema selecionado:</b><br>
            <span style="color:#0ef;">${star.name}</span><br>
            Escolha um planeta:
          `;
          let planetsHtml = `<div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;max-width:400px;">`;
          for (let i = 0; i < star.planets.length; i++) {
            planetsHtml += `<button style="margin:4px;padding:6px 12px;background:#222;color:#0ef;border:1px solid #0ef;border-radius:4px;cursor:pointer;font-size:0.9em;white-space:nowrap;" onclick="selectInitialPlanet(${i})">${star.planets[i]}</button>`;
          }
          planetsHtml += `</div>
          <button style="margin:8px 4px;padding:8px 24px;background:#222;color:#0ef;border:1px solid #0ef;border-radius:6px;cursor:pointer;" onclick="cancelInitialSelection()">Cancelar</button>`;
          document.getElementById("startSelectionPlanets").innerHTML = planetsHtml;
          document.getElementById("startSelectionConfirm").innerHTML = "";
        } else {
          // Se não clicou em estrela, inicia o dragging durante a seleção
          dragging = true;
          dragStart.x = e.clientX;
          dragStart.y = e.clientY;
        }
        return;
      }

      if (dragging) {
        const dx = e.clientX - dragStart.x;
        const dy = e.clientY - dragStart.y;
        offsetX += dx;
        offsetY += dy;
        dragStart.x = e.clientX;
        dragStart.y = e.clientY;
      } else {
        // Inicia o drag
        dragging = true;
        dragStart.x = e.clientX;
        dragStart.y = e.clientY;
        
        // Verifica se clicou em botão de velocidade
        for (const btn of timeButtonRects) {
          if (e.clientX >= btn.x && e.clientX <= btn.x + btn.w &&
              e.clientY >= btn.y && e.clientY <= btn.y + btn.h) {
            timeSpeed = btn.speed;
            return;
          }
        }
        
        // Mostra info da estrela
        const star = findStarAt(e.clientX, e.clientY);
        if (star) {
          showStarInfo(star, e.clientX, e.clientY);
        } else {
          document.getElementById("starPanel").style.display = "none";
        }
      }
    });

    canvas.addEventListener("mouseup", e => {
      dragging = false;
    });

    canvas.addEventListener("mousemove", e => {
      mousePos.x = e.clientX;
      mousePos.y = e.clientY;
      
      if (dragging) {
        const dx = e.clientX - dragStart.x;
        const dy = e.clientY - dragStart.y;
        offsetX += dx;
        offsetY += dy;
        dragStart.x = e.clientX;
        dragStart.y = e.clientY;
      }
    });

    canvas.addEventListener("wheel", e => {
      e.preventDefault();
      const delta = -e.deltaY * 0.001;
      const mouseX = e.clientX;
      const mouseY = e.clientY;

      // Calcula a posição do mundo antes do zoom
      const worldBeforeZoom = screenToWorld(mouseX, mouseY);

      // Aplica o zoom
      const newZoom = Math.max(0.1, Math.min(3, zoom * (1 + delta)));
      const zoomFactor = newZoom / zoom;
      zoom = newZoom;

      // Atualiza o offset para manter o ponto do mouse fixo
      const worldAfterZoom = screenToWorld(mouseX, mouseY);

      if (Math.abs(targetZoom - zoom) > 0.001) {
        const worldAfterZoom = screenToWorld(mouseX, mouseY);
        offsetX += (worldAfterZoom.x - worldBeforeZoom.x) * zoom;
        offsetY += (worldAfterZoom.y - worldBeforeZoom.y) * zoom;

        zoomAnimationFrame = requestAnimationFrame(animateZoom);
      } else {
        zoom = targetZoom;
      }

      animateZoom();
    });

    // Funções de save/load
function getAllSaves() {
  return JSON.parse(localStorage.getItem("cosmic_saves") || "[]");
}

function saveGame(name) {
  const saves = getAllSaves();
  const idx = saves.findIndex(s => s.name === name);
  const saveData = {
    name,
    seed,
    credits,
    gameDay,
    gameMonth,
    gameYear,
    offsetX,
    offsetY,
    zoom,
    playerStartSystem,
    playerStartPlanet,
    playerSystemX,
    playerSystemY,
    date: new Date().toLocaleString()
  };
  if (idx >= 0) saves[idx] = saveData;
  else saves.push(saveData);
  localStorage.setItem("cosmic_saves", JSON.stringify(saves));
  renderSavesPanel();
}

function loadGame(name) {
  const saves = getAllSaves();
  const save = saves.find(s => s.name === name);
  if (!save) return;

  seed = save.seed;
  credits = save.credits;
  gameDay = save.gameDay;
  gameMonth = save.gameMonth;
  gameYear = save.gameYear;
  offsetX = save.offsetX;
  offsetY = save.offsetY;
  zoom = save.zoom;
  playerStartSystem = save.playerStartSystem || null;
  playerStartPlanet = save.playerStartPlanet || null;
  playerSystemX = save.playerSystemX || null;
  playerSystemY = save.playerSystemY || null;
  document.getElementById("seedInput").value = seed;
  starCache = {};
  nameRegistry = {};
  drawUniverse();

  // Se o save tem sistema inicial, desativa a seleção inicial
  if (playerStartSystem) {
    initialSelectionActive = false;
    document.getElementById("startSelectionBox").style.display = "none";
  } else {
    // Se não tem sistema inicial, ativa a seleção
    initialSelectedActive = true;
    document.getElementById("startSelectionBox").style.display = "block";
    document.getElementById("startSelectionText").innerText = "Escolha um local para começar.";
    document.getElementById("startSelectionPlanets").innerHTML = "";
    document.getElementById("startSelectionConfirm").innerHTML = "";
  }

  document.getElementById("seedInput").value = seed;
  starCache = {};
  nameRegistry = {};
  drawUniverse();
}

function deleteGame(name) {
  let saves = getAllSaves();
  saves = saves.filter(s => s.name !== name);
  localStorage.setItem("cosmic_saves", JSON.stringify(saves));
  renderSavesPanel();
}

function renameGame(oldName, newName) {
  const saves = getAllSaves();
  const idx = saves.findIndex(s => s.name === oldName);
  if (idx >= 0) {
    saves[idx].name = newName;
    localStorage.setItem("cosmic_saves", JSON.stringify(saves));
    renderSavesPanel();
  }
}

// Renderiza painel de saves no leftPanel
function renderSavesPanel() {
  const panel = document.getElementById("leftPanel");
  let html = `
    <h3>Opções</h3>
    <label for="seedInput">Seed:</label>
    <input id="seedInput" placeholder="Digite a seed..." value="${seed}">
    <button onclick="regenerateFromSeed()">Gerar</button>
    <hr>
    <h4>Salvamentos</h4>
    <input id="saveNameInput" placeholder="Nome do save..." style="width:70%">
    <button onclick="saveGame(document.getElementById('saveNameInput').value.trim())">Salvar</button>
    <div id="savesList" style="margin-top:10px;">
  `;
  const saves = getAllSaves();
  for (const s of saves) {
    html += `
      <div style="margin-bottom:6px; border-bottom:1px solid #333;">
        <b>${s.name}</b> <small>(${s.date})</small><br>
        Seed: <span style="color:#0ef">${s.seed}</span> | Créditos: ${s.credits} | Data: ${String(s.gameDay).padStart(2,"0")}/${String(s.gameMonth).padStart(2,"0")}/${s.gameYear}<br>
        <button onclick="loadGame('${s.name}')">Carregar</button>
        <button onclick="deleteGame('${s.name}')">Excluir</button>
        <button onclick="renamePrompt('${s.name}')">Renomear</button>
      </div>
    `;
  }
  html += `</div>`;
  panel.innerHTML = html;
  // Reatribui eventos para seed input
  document.getElementById("seedInput").addEventListener("focus", () => isTyping = true);
  document.getElementById("seedInput").addEventListener("blur", () => isTyping = false);
}

// Prompt para renomear
function renamePrompt(oldName) {
  const newName = prompt("Novo nome para o save:", oldName);
  if (newName && newName.trim() && newName !== oldName) {
    renameGame(oldName, newName.trim());
  }
}

// Chame renderSavesPanel ao abrir o painel
document.addEventListener("keydown", e => {
  if (e.key === "Escape" && !isTyping) {
    const panel = document.getElementById("leftPanel");
    if (panel.style.display === "block") {
      panel.style.display = "none";
    } else {
      renderSavesPanel();
      panel.style.display = "block";
    }
  }
  if (e.key === "f" && !isTyping) {
    toggleShipPanel();
  }
  if (e.key === "h" && !isTyping) {
    goToPlayerSystem();
  }
  if (e.key === ";") {
    developerModeActive = !developerModeActive;
  }
  if (e.code === "Space") {
    timePaused = !timePaused;
  }
  if (developerModeActive && !isTyping) {
    // Console de comandos
    if (e.key.length === 1 && devCommand.length < 40) {
      devCommand += e.key;
    } else if (e.key === "Backspace") {
      devCommand = devCommand.slice(0, -1);
    } else if (e.key === "Enter") {
      devLog("> " + devCommand);
      processDevCommand(devCommand);
      devCommandHistory.push(devCommand);
      devCommandHistoryIndex = devCommandHistory.length;
      devCommand = "";
    } else if (e.key === "ArrowUp") {
      if (devCommandHistoryIndex > 0) {
        devCommandHistoryIndex--;
        devCommand = devCommandHistory[devCommandHistoryIndex] || "";
      }
    } else if (e.key === "ArrowDown") {
      if (devCommandHistoryIndex < devCommandHistory.length - 1) {
        devCommandHistoryIndex++;
        devCommand = devCommandHistory[devCommandHistoryIndex] || "";
      } else {
        devCommand = "";
      }
    }
  }
});

function regenerateFromSeed() {
  const input = document.getElementById("seedInput").value.trim();
  if (!input) return;
  seed = input;
  starCache = {};
  nameRegistry = {};

  // Reset das variáveis do jogo
  credits = 0;
  gameDay = 1;
  gameMonth = 1;
  gameYear = 2253;
  timePaused = true;

  playerStartSystem = null;
  playerStartPlanet = null;
  initialSelectionActive = true;
  initialSelectedStar = null;
  initialSelectedPlanet = null;
  document.getElementById("startSelectionBox").style.display = "block";
  document.getElementById("startSelectionText").innerText = "Escolha um local para começar.";
  document.getElementById("startSelectionPlanets").innerHTML = "";
  document.getElementById("startSelectionConfirm").innerHTML = "";

  drawUniverse();
}

// No final do script, substitua o setInterval por requestAnimationFrame para melhor controle do tempo:
let lastFrame = performance.now();
function gameLoop(now) {
  const dt = now - lastFrame;
  lastFrame = now;
  updateGameTime(dt);
  drawUniverse();
  requestAnimationFrame(gameLoop);
}
requestAnimationFrame(gameLoop);

// Mostra a caixa de seleção inicial ao carregar
window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("startSelectionBox").style.display = "block";
  initialSelectionActive = true;
  initialSelectedStar = null;
  initialSelectedPlanet = null;
  document.getElementById("startSelectionText").innerText = "Escolha um local para começar.";
  document.getElementById("startSelectionPlanets").innerHTML = "";
  document.getElementById("startSelectionConfirm").innerHTML = "";
});


  // Função para criar uma nova nave
function createShip(className, shipIndex, customName = null) {
  const shipData = shipClasses[className].ships[shipIndex];
  return {
    id: Date.now() + Math.random(), // ID único
    className: className,
    shipIndex: shipIndex,
    name: customName || shipData.name,
    hull: shipData.hull,
    currentHull: shipData.hull, // Vida atual
    size: shipData.size,
    speed: shipData.speed,
    cargo: shipData.cargo,
    crew: shipData.crew,
    maxCrew: shipData.crew,
    currentCrew: 0, // Tripulação atual
    location: playerStartSystem || "Unknown", // Sistema atual
    status: "docked" // docked, traveling, exploring
  };
}

// Função para inicializar a nave inicial do jogador
function initializePlayerShip() {
  if (playerStartSystem && playerShips.length === 0) {
    // Cria a nave inicial (Scout - Exploradora básica)
    const initialShip = createShip("exploradora", 0, "Pioneer");
    initialShip.currentCrew = 2; // Vem com tripulação completa
    playerShips.push(initialShip);
    activeShip = initialShip;
    
    devLog ? devLog("Nave inicial criada: " + initialShip.name) : null;
  }
}
// Inicializa a nave do jogador
initializePlayerShip();

function toggleShipPanel() {
  const panel = document.getElementById("shipPanel");
  if (panel.style.display === "block") {
    panel.style.display = "none";
  } else {
    renderShipPanel();
    panel.style.display = "block";
  }
}

function renderShipPanel() {
  const panel = document.getElementById("shipPanel");
  let html = `
    <h3>Frota</h3>
    <div style="margin-bottom: 15px;">
      <b>Naves: ${playerShips.length}</b>
    </div>
  `;
  
  for (const ship of playerShips) {
    const isActive = ship === activeShip;
    const statusColor = ship.status === "docked" ? "#0ef" : "#ff0";
    
    html += `
      <div style="margin-bottom: 10px; padding: 10px; border: 1px solid ${isActive ? '#0ef' : '#555'}; border-radius: 4px; background: ${isActive ? 'rgba(0,234,255,0.1)' : 'rgba(0,0,0,0.3)'};">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <b style="color: ${isActive ? '#0ef' : '#fff'};">${ship.name}</b>
          <span style="color: ${statusColor}; font-size: 12px;">${ship.status.toUpperCase()}</span>
        </div>
        <div style="font-size: 12px; color: #ccc; margin-top: 4px;">
          ${shipClasses[ship.className].name} - ${shipClasses[ship.className].ships[ship.shipIndex].name}
        </div>
        <div style="font-size: 11px; color: #999; margin-top: 6px;">
          Casco: ${ship.currentHull}/${ship.hull} | Velocidade: ${ship.speed}
        </div>
        <div style="font-size: 11px; color: #999;">
          Carga: ${ship.cargo} | Tripulação: ${ship.currentCrew}/${ship.maxCrew}
        </div>
        <div style="font-size: 11px; color: #999;">
          Local: ${ship.location}
        </div>
        ${!isActive ? `<button onclick="setActiveShip('${ship.id}')" style="margin-top: 6px; padding: 4px 8px; background: #222; color: #0ef; border: 1px solid #0ef; border-radius: 3px; cursor: pointer; font-size: 11px;">Selecionar</button>` : ''}
      </div>
    `;
  }
  
  // Lista das naves disponíveis para compra
  for (const [className, classData] of Object.entries(shipClasses)) {
    html += `<div style="margin-bottom: 8px;"><b>${classData.name}:</b></div>`;
    for (let i = 0; i < classData.ships.length; i++) {
      const ship = classData.ships[i];
      const canAfford = credits >= ship.cost;
      html += `
        <div style="margin-left: 15px; margin-bottom: 6px; padding: 6px; border: 1px solid #333; border-radius: 3px; background: rgba(0,0,0,0.2);">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="color: ${canAfford ? '#fff' : '#666'};">${ship.name}</span>
            <span style="color: ${canAfford ? '#0ef' : '#f60'};">Cr ${ship.cost}</span>
          </div>
          <div style="font-size: 10px; color: #888;">
            Casco: ${ship.hull} | Velocidade: ${ship.speed} | Carga: ${ship.cargo} | Tripulação: ${ship.crew}
          </div>
          ${canAfford ? `<button onclick="buyShip('${className}', ${i})" style="margin-top: 4px; padding: 3px 6px; background: #222; color: #0ef; border: 1px solid #0ef; border-radius: 2px; cursor: pointer; font-size: 10px;">Comprar</button>` : ''}
        </div>
      `;
    }
  }
  
  panel.innerHTML = html;
}

// Função para definir nave ativa
function setActiveShip(shipId) {
  const ship = playerShips.find(s => s.id == shipId);
  if (ship) {
    activeShip = ship;
    renderShipPanel();
    devLog ? devLog(`Nave ativa: ${ship.name}`) : null;
  }
}

// Função para comprar naves
function buyShip(className, shipIndex) {
  const shipData = shipClasses[className].ships[shipIndex];
  if (credits >= shipData.cost) {
    credits -= shipData.cost;
    const newShip = createShip(className, shipIndex);
    newShip.location = playerStartSystem || "Unknown";
    playerShips.push(newShip);
    renderShipPanel();
    devLog ? devLog(`Nova nave adquirida: ${newShip.name}`) : null;
  }
}