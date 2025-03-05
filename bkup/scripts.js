const container = document.getElementById('sphere-container');
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 3, 5);
    scene.add(directionalLight);
    const pointLight = new THREE.PointLight(0xffffff, 0.5);
    pointLight.position.set(-2, 1, 3);
    scene.add(pointLight);

    const textureLoader = new THREE.TextureLoader();
    const proxy = 'https://cors-anywhere.herokuapp.com/';
    const textures = {
      sun: textureLoader.load(`${proxy}https://www.solarsystemscope.com/textures/download/2k_sun.jpg`),
      mercury: textureLoader.load(`${proxy}https://www.solarsystemscope.com/textures/download/2k_mercury.jpg`),
      venus: textureLoader.load(`${proxy}https://www.solarsystemscope.com/textures/download/2k_venus_surface.jpg`),
      earth: textureLoader.load(`${proxy}https://www.solarsystemscope.com/textures/download/2k_earth_daymap.jpg`, 
        () => {
          console.log('Earth texture loaded successfully');
          planetMaterial.map = textures.earth;
          planetMaterial.color.setHex(0xFFFFFF);
          planetMaterial.opacity = 1.0;
          planetMaterial.needsUpdate = true;
          renderer.render(scene, camera);
        }, 
        undefined, 
        (err) => console.error('Earth texture failed:', err.message || 'Unknown error')
      ),
      mars: textureLoader.load(`${proxy}https://www.solarsystemscope.com/textures/download/2k_mars.jpg`),
      jupiter: textureLoader.load(`${proxy}https://www.solarsystemscope.com/textures/download/2k_jupiter.jpg`),
      saturn: textureLoader.load(`${proxy}https://www.solarsystemscope.com/textures/download/2k_saturn.jpg`),
      uranus: textureLoader.load(`${proxy}https://www.solarsystemscope.com/textures/download/2k_uranus.jpg`),
      neptune: textureLoader.load(`${proxy}https://www.solarsystemscope.com/textures/download/2k_neptune.jpg`),
      moon: textureLoader.load(`${proxy}https://www.solarsystemscope.com/textures/download/2k_moon.jpg`)
    };

    const geometry = new THREE.SphereGeometry(2, 32, 32);
const planetMaterial = new THREE.MeshPhongMaterial({
  color: 0xFFFFFF,
  transparent: true,
  opacity: 1.0,
  map: textures.earth,
  shininess: 10
});

const wireframe = new THREE.WireframeGeometry(geometry);
const lineMaterial = new THREE.LineBasicMaterial({ 
  color: 0x00FFFF, 
  transparent: true, 
  opacity: 0.4 
});
const wireframeMesh = new THREE.LineSegments(wireframe, lineMaterial);

const planetSphere = new THREE.Mesh(geometry, planetMaterial);
const sphereGroup = new THREE.Group();
sphereGroup.add(wireframeMesh);
sphereGroup.add(planetSphere);

const orbitGeometry = new THREE.TorusGeometry(3, 0.001, 16, 100);
const orbitMaterial = new THREE.MeshBasicMaterial({ 
  color: 0x00FFFF,
  transparent: true,
  opacity: 0.3
});
const orbit = new THREE.Mesh(orbitGeometry, orbitMaterial);
orbit.rotation.x = Math.PI / 2;
sphereGroup.add(orbit);

scene.add(sphereGroup);

// Set initial rotation for the sphere
sphereGroup.rotation.x = Math.PI / 36; // Tilt 30 degrees on the X-axis
sphereGroup.rotation.y = Math.PI / 2; // Tilt 45 degrees on the Y-axis

let isRotating = true;
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };
let rotationSpeed = 0.001;
let rotationState = 1;
let crosshairOverlayVisible = true;
let orbitalPathVisible = true;
let isTextureVisible = true;
let holoHudVisible = true;

let currentPlanet = 'earth';
let currentTexture = textures[currentPlanet];

const defaultSettings = {
  rotationSpeed: 0.001,
  rotationState: 1,
  wireframeOpacity: 0.4,
  textureVisible: true,
  wireframeVisible: true,
  crosshairOverlayVisible: true,
  orbitalPathVisible: true,
  holoHudVisible: true,
  sphereColor: 0xFFFFFF,
  sphereColorNoTexture: 0x00FFFF,
  opacity: 1.0,
  shininess: 10
};

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const planetSelect = document.getElementById('planet-select');
    const crosshairOverlay = document.getElementById('crosshair-overlay');
    const holoHud = document.getElementById('holo-hud');
    let currentOpacity = 1.0;
    let targetOpacity = 1.0;
    let opacityChangeSpeed = 0.05;
    let isFading = false;

    const holoTransmission = document.getElementById('holo-transmission');
    const holoCoordinates = document.getElementById('holo-coordinates');
    const holoIntegrity = document.getElementById('holo-integrity');
    const holoSignal = document.getElementById('holo-signal');
    const holoEnergy = document.getElementById('holo-energy');

    let currentSignal = -45;

    function updateHoloHud() {
      if (!holoHudVisible) return;
      const transmissionCode = `0xFF${Math.floor(Math.random() * 10000).toString(16).padStart(4, '0').toUpperCase()}`;
      holoTransmission.textContent = `INCOMING TRANSMISSION: ${transmissionCode}`;
      const x = (Math.random() * 100 - 50).toFixed(1);
      const y = (Math.random() * 100 - 50).toFixed(1);
      const z = (Math.random() * 100 - 50).toFixed(1);
      holoCoordinates.textContent = `COORDINATES: X:${x} Y:${y} Z:${z}`;
      const integrity = Math.floor(Math.random() * (100 - 80) + 80);
      holoIntegrity.textContent = `SYSTEM INTEGRITY: ${integrity}%`;
      const signalChange = Math.floor(Math.random() * 5 - 2);
      currentSignal = Math.max(-50, Math.min(-40, currentSignal + signalChange));
      holoSignal.textContent = `SIGNAL: ${currentSignal} dB`;
      const energy = Math.floor(Math.random() * (90 - 70) + 70);
      holoEnergy.textContent = `ENERGY: ${energy}%`;
    }
    setInterval(updateHoloHud, 5000);

    function fadeSphere(callback) {
      if (isFading) return;
      isFading = true;
      targetOpacity = 0;
      const fadeOutInterval = setInterval(() => {
        currentOpacity = Math.max(currentOpacity - opacityChangeSpeed, 0);
        planetMaterial.opacity = currentOpacity;
        planetMaterial.needsUpdate = true;
        renderer.render(scene, camera);
        if (currentOpacity <= 0) {
          clearInterval(fadeOutInterval);
          callback();
          const fadeInInterval = setInterval(() => {
            currentOpacity = Math.min(currentOpacity + opacityChangeSpeed, 1);
            planetMaterial.opacity = currentOpacity;
            planetMaterial.needsUpdate = true;
            renderer.render(scene, camera);
            if (currentOpacity >= 1) {
              clearInterval(fadeInInterval);
              isFading = false;
              targetOpacity = 1;
            }
          }, 20);
        }
      }, 20);
    }

    planetSelect.addEventListener('change', (event) => {
      const planet = event.target.value;
      currentPlanet = planet;
      currentTexture = textures[planet];
      fadeSphere(() => {
        planetMaterial.map = isTextureVisible ? currentTexture : null;
        planetMaterial.color.setHex(isTextureVisible ? 0xFFFFFF : defaultSettings.sphereColorNoTexture);
        planetMaterial.opacity = isTextureVisible ? 1.0 : 0.2;
        planetMaterial.needsUpdate = true;
        renderer.render(scene, camera);
        console.log(`Switched to ${planet}`);
      });
    });

    Object.keys(textures).forEach(key => {
      if (key !== 'earth') {
        textures[key].onLoad = () => {
          console.log(`${key} texture loaded successfully`);
          if (currentPlanet === key) {
            currentTexture = textures[key];
            planetMaterial.map = isTextureVisible ? currentTexture : null;
            planetMaterial.color.setHex(isTextureVisible ? 0xFFFFFF : defaultSettings.sphereColorNoTexture);
            planetMaterial.opacity = isTextureVisible ? 1.0 : 0.2;
            planetMaterial.needsUpdate = true;
            renderer.render(scene, camera);
          }
        };
        textures[key].onError = (err) => {
          console.error(`${key} texture failed: ${err.message || 'Unknown error'}`);
          if (currentPlanet === key) {
            planetMaterial.map = null;
            planetMaterial.color.setHex(defaultSettings.sphereColorNoTexture);
            planetMaterial.opacity = 0.2;
            planetMaterial.needsUpdate = true;
            renderer.render(scene, camera);
          }
        };
      }
    });

    function onMouseMove(event) {
      mouse.x = ((event.clientX - container.offsetLeft) / container.clientWidth) * 2 - 1;
      mouse.y = -((event.clientY - container.offsetTop) / container.clientHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersectsSphere = raycaster.intersectObject(planetSphere);

      if (intersectsSphere.length > 0 && !isDragging) {
        isRotating = false;
      } else if (!isDragging) {
        isRotating = true;
      }

      if (isDragging) {
        const deltaMove = {
          x: event.clientX - previousMousePosition.x,
          y: event.clientY - previousMousePosition.y
        };
        
        sphereGroup.rotation.y += deltaMove.x * 0.005;
        sphereGroup.rotation.x += deltaMove.y * 0.005;
        sphereGroup.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, sphereGroup.rotation.x));
        
        previousMousePosition = {
          x: event.clientX,
          y: event.clientY
        };
      }
    }

    container.addEventListener('mousemove', onMouseMove);

    container.addEventListener('mousedown', (e) => {
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObject(planetSphere);
      if (intersects.length > 0) {
        isDragging = true;
        isRotating = false;
        previousMousePosition = {
          x: e.clientX,
          y: e.clientY
        };
      }
    });

    document.addEventListener('mouseup', () => {
      isDragging = false;
    });

    function animate() {
      requestAnimationFrame(animate);
      
      if (isRotating && !isDragging && rotationSpeed !== 0) {
        sphereGroup.rotation.y += rotationSpeed;
        if (orbitalPathVisible) {
          orbit.rotation.z += 0.005;
        }
      }
      
      const pulseScale = 1 + 0.05 * Math.sin(Date.now() * 0.001);
      planetSphere.scale.set(pulseScale, pulseScale, pulseScale);
      
      if (Math.random() > 0.98) {
        lineMaterial.opacity = 0.1 + Math.random() * 0.5;
      }
      
      renderer.render(scene, camera);
    }

    function resizeRenderer() {
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    }

    window.addEventListener('resize', resizeRenderer);

    function playAudio(audio, duration = null, onEnded = null) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.log('Audio playback failed:', error);
          const terminalContent = document.getElementById('terminal-content');
          terminalContent.innerHTML += `<br>${new Date().toISOString().slice(11, 19)} > Audio playback failed: ${error.message}<br>`;
        });
      }
      if (duration) {
        setTimeout(() => {
          audio.pause();
          audio.currentTime = 0;
          if (onEnded) onEnded();
        }, duration * 1000);
      }
    }

    const buttonSound = new Audio('https://www.soundjay.com/buttons/beep-21.mp3');
    const scanSound = new Audio('https://www.soundjay.com/mechanical/freezer-hum-1.mp3');
    const scanCompleteSound = new Audio('https://www.soundjay.com/mechanical/camera-shutter-click-01.mp3');

    const hexagons = document.querySelectorAll('.hexagon');
    hexagons.forEach((hex, index) => {
      hex.addEventListener('click', () => {
        hex.classList.toggle('active');
        playAudio(buttonSound);
        switch (index) {
          case 0:
            rotationState = (rotationState + 1) % 3;
            if (rotationState === 0) {
              rotationSpeed = 0;
              console.log('Rotation stopped');
            } else if (rotationState === 1) {
              rotationSpeed = 0.001;
              console.log('Rotation speed set to slow (0.001)');
            } else {
              rotationSpeed = 0.005;
              console.log('Rotation speed set to fast (0.005)');
            }
            document.getElementById('rotation-slider').value = rotationSpeed;
            break;
          case 1:
            crosshairOverlayVisible = !crosshairOverlayVisible;
            orbitalPathVisible = !orbitalPathVisible;
            crosshairOverlay.style.display = crosshairOverlayVisible ? 'flex' : 'none';
            orbit.visible = orbitalPathVisible;
            console.log(`Crosshair and orbital path ${crosshairOverlayVisible ? 'visible' : 'hidden'}`);
            break;
          case 2:
            isTextureVisible = !isTextureVisible;
            if (isTextureVisible) {
              planetMaterial.map = currentTexture;
              planetMaterial.color.setHex(0xFFFFFF);
              planetMaterial.opacity = 1.0;
            } else {
              planetMaterial.map = null;
              planetMaterial.color.setHex(defaultSettings.sphereColorNoTexture);
              planetMaterial.opacity = 0.2;
            }
            planetMaterial.needsUpdate = true;
            console.log(`Texture visibility ${isTextureVisible ? 'enabled' : 'disabled'}`);
            break;
          case 3:
            wireframeMesh.visible = !wireframeMesh.visible;
            console.log(`Wireframe ${wireframeMesh.visible ? 'visible' : 'hidden'}`);
            break;
          case 4:
            rotationSpeed = defaultSettings.rotationSpeed;
            rotationState = defaultSettings.rotationState;
            crosshairOverlayVisible = defaultSettings.crosshairOverlayVisible;
            orbitalPathVisible = defaultSettings.orbitalPathVisible;
            holoHudVisible = defaultSettings.holoHudVisible;
            crosshairOverlay.style.display = crosshairOverlayVisible ? 'flex' : 'none';
            orbit.visible = orbitalPathVisible;
            holoHud.style.display = holoHudVisible ? 'block' : 'none';
            lineMaterial.opacity = defaultSettings.wireframeOpacity;
            isTextureVisible = defaultSettings.textureVisible;
            planetMaterial.map = isTextureVisible ? currentTexture : null;
            planetMaterial.color.setHex(isTextureVisible ? defaultSettings.sphereColor : defaultSettings.sphereColorNoTexture);
            planetMaterial.opacity = defaultSettings.opacity;
            planetMaterial.shininess = defaultSettings.shininess;
            wireframeMesh.visible = defaultSettings.wireframeVisible;
            hexagons.forEach(h => h.classList.add('active'));
            planetMaterial.needsUpdate = true;
            document.getElementById('rotation-slider').value = rotationSpeed;
            document.getElementById('opacity-slider').value = planetMaterial.opacity;
            document.getElementById('shininess-slider').value = planetMaterial.shininess;
            console.log('Settings reset to default');
            break;
          case 5:
            holoHudVisible = !holoHudVisible;
            holoHud.style.display = holoHudVisible ? 'block' : 'none';
            console.log(`Holo HUD ${holoHudVisible ? 'visible' : 'hidden'}`);
            break;
        }
      });
    });

    const warningText = document.getElementById('warning-text');
    const warnings = [
      "WARNING: UNUSUAL ENERGY SIGNATURE DETECTED",
      "ALERT: GRAVITATIONAL ANOMALY DETECTED",
      "CAUTION: THERMAL SPIKE DETECTED",
      "ERROR: UNKNOWN SIGNAL INTERFERENCE",
      "NOTICE: CORE STABILITY FLUCTUATING"
    ];
    let currentWarningIndex = 0;
    let currentText = '';
    let charIndex = 0;
    let isTyping = true;

    function updateWarning() {
      if (isTyping) {
        if (charIndex < warnings[currentWarningIndex].length) {
          currentText += warnings[currentWarningIndex][charIndex];
          charIndex++;
        } else {
          isTyping = false;
          setTimeout(() => {
            isTyping = false;
            charIndex--;
          }, 4000);
        }
      } else {
        if (charIndex >= 0) {
          currentText = warnings[currentWarningIndex].substring(0, charIndex);
          charIndex--;
        } else {
          isTyping = true;
          charIndex = 0;
          currentText = '';
          currentWarningIndex = (currentWarningIndex + 1) % warnings.length;
        }
      }
      warningText.textContent = currentText;
    }

    setInterval(updateWarning, 100);

    const timeDisplay = document.querySelector('.time');
    setInterval(() => {
      const currentTime = timeDisplay.textContent;
      const timeParts = currentTime.replace('T-MINUS ', '').split(':');
      let hours = parseInt(timeParts[0]);
      let mins = parseInt(timeParts[1]);
      let secs = parseInt(timeParts[2]);
      
      secs -= 1;
      if (secs < 0) {
        secs = 59;
        mins -= 1;
        if (mins < 0) {
          mins = 59;
          hours -= 1;
          if (hours < 0) {
            hours = 0;
            mins = 0;
            secs = 0;
          }
        }
      }
      
      const formattedTime = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      timeDisplay.textContent = `T-MINUS ${formattedTime}`;
    }, 1000);

    const commandInput = document.getElementById('command-input');
    const terminalContent = document.getElementById('terminal-content');
    
    commandInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const command = commandInput.value.trim().toUpperCase();
        if (!command) return;
        
        terminalContent.innerHTML += `${new Date().toISOString().slice(11, 19)} > CMD: ${command}<br>`;
        executeCommand(command);
        commandInput.value = '';
        terminalContent.style.animation = 'none';
        setTimeout(() => {
          terminalContent.style.animation = 'scroll 20s linear infinite';
        }, 10);
      }
    });

    const resourceCtx = document.getElementById('resource-chart').getContext('2d');
new Chart(resourceCtx, {
  type: 'line',
  data: {
    labels: ['Oxygen', 'Water', 'Food', 'Fuel'],
    datasets: [{
      label: 'Resource Levels',
      data: [80, 40, 60, 30],
      backgroundColor: ['#00FFFF', '#00FFFF', '#00FFFF', '#00FFFF'],
      borderColor: ['#00FFFF', '#00FFFF', '#00FFFF', '#00FFFF'],
      borderWidth: 1
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        grid: { borderColor: '#333', color: '#333' },
        ticks: { color: '#00FFFF' }
      },
      x: { grid: { borderColor: '#333', color: '#333' }, ticks: { color: '#FF4800' } }
    },
    plugins: {
      legend: {
        labels: {
          color: '#FF4800', // Customize the color of the legend labels
          boxWidth: 10, // Customize the width of the colored box
          padding: 10 // Customize the padding around the legend items
        }
      }
    }
  }
});

    const scanProgress = document.getElementById('scan-progress');
    const scanLines = document.getElementById('scan-lines');
    const progressCircle = document.getElementById('progress-circle');
    const progressPercentage = document.getElementById('progress-percentage');

    function showScanProgress() {
      scanProgress.classList.add('active');
      scanLines.classList.add('active');
      let percentage = 0;
      const interval = setInterval(() => {
        percentage += 2;
        if (percentage > 100) percentage = 100;
        progressPercentage.textContent = `${Math.floor(percentage)}%`;
        if (percentage >= 100) clearInterval(interval);
      }, 100);
    }

    function hideScanProgress() {
      scanProgress.classList.remove('active');
      scanLines.classList.remove('active');
      progressCircle.style.strokeDashoffset = 753;
      progressPercentage.textContent = '0%';
    }

    const analyzeGrid = document.getElementById('analyze-grid');
    const analyzePercentage = document.getElementById('analyze-percentage');

    function showAnalyzeProgress() {
      analyzeGrid.classList.add('active');
      let percentage = 0;
      const interval = setInterval(() => {
        percentage += 2;
        if (percentage > 100) percentage = 100;
        analyzePercentage.textContent = `${Math.floor(percentage)}%`;
        if (percentage >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            analyzeGrid.classList.remove('active');
            analyzePercentage.textContent = '0%';
          }, 500);
        }
      }, 100);
    }

    function executeCommand(command) {
      switch (command) {
        case 'ANALYZE':
          showAnalyzeProgress();
          playAudio(scanSound, 5, () => {
            playAudio(scanCompleteSound);
            terminalContent.innerHTML += `${new Date().toISOString().slice(11, 19)} > Analysis completed<br>`;
            terminalContent.style.animation = 'none';
            setTimeout(() => {
              terminalContent.style.animation = 'scroll 20s linear infinite';
            }, 10);
          });
          terminalContent.innerHTML += `${new Date().toISOString().slice(11, 19)} > Initiating analysis...<br>`;
          terminalContent.style.animation = 'none';
          setTimeout(() => {
            terminalContent.style.animation = 'scroll 20s linear infinite';
          }, 10);
          break;
        case 'SCAN':
          showScanProgress();
          playAudio(scanSound, 5, () => {
            playAudio(scanCompleteSound);
            hideScanProgress();
            terminalContent.innerHTML += `${new Date().toISOString().slice(11, 19)} > Scan completed<br>`;
            terminalContent.style.animation = 'none';
            setTimeout(() => {
              terminalContent.style.animation = 'scroll 20s linear infinite';
            }, 10);
          });
          terminalContent.innerHTML += `${new Date().toISOString().slice(11, 19)} > Initiating scan...<br>`;
          terminalContent.style.animation = 'none';
          setTimeout(() => {
            terminalContent.style.animation = 'scroll 20s linear infinite';
          }, 10);
          break;
        case 'ROTATE FAST':
          rotationSpeed = 0.005;
          rotationState = 2;
          hexagons[0].classList.add('active');
          document.getElementById('rotation-slider').value = rotationSpeed;
          terminalContent.innerHTML += `${new Date().toISOString().slice(11, 19)} > Rotation speed set to fast<br>`;
          terminalContent.style.animation = 'none';
          setTimeout(() => {
            terminalContent.style.animation = 'scroll 20s linear infinite';
          }, 10);
          break;
        case 'ROTATE SLOW':
          rotationSpeed = 0.001;
          rotationState = 1;
          hexagons[0].classList.add('active');
          document.getElementById('rotation-slider').value = rotationSpeed;
          terminalContent.innerHTML += `${new Date().toISOString().slice(11, 19)} > Rotation speed set to slow<br>`;
          terminalContent.style.animation = 'none';
          setTimeout(() => {
            terminalContent.style.animation = 'scroll 20s linear infinite';
          }, 10);
          break;
        case 'ROTATE STOP':
          rotationSpeed = 0;
          rotationState = 0;
          hexagons[0].classList.remove('active');
          document.getElementById('rotation-slider').value = rotationSpeed;
          terminalContent.innerHTML += `${new Date().toISOString().slice(11, 19)} > Rotation stopped<br>`;
          terminalContent.style.animation = 'none';
          setTimeout(() => {
            terminalContent.style.animation = 'scroll 20s linear infinite';
          }, 10);
          break;
        case 'RESET':
          rotationSpeed = defaultSettings.rotationSpeed;
          rotationState = defaultSettings.rotationState;
          crosshairOverlayVisible = defaultSettings.crosshairOverlayVisible;
          orbitalPathVisible = defaultSettings.orbitalPathVisible;
          holoHudVisible = defaultSettings.holoHudVisible;
          crosshairOverlay.style.display = crosshairOverlayVisible ? 'flex' : 'none';
          orbit.visible = orbitalPathVisible;
          holoHud.style.display = holoHudVisible ? 'block' : 'none';
          lineMaterial.opacity = defaultSettings.wireframeOpacity;
          isTextureVisible = defaultSettings.textureVisible;
          planetMaterial.map = isTextureVisible ? currentTexture : null;
          planetMaterial.color.setHex(isTextureVisible ? defaultSettings.sphereColor : defaultSettings.sphereColorNoTexture);
          planetMaterial.opacity = defaultSettings.opacity;
          planetMaterial.shininess = defaultSettings.shininess;
          wireframeMesh.visible = defaultSettings.wireframeVisible;
          hexagons.forEach(h => h.classList.add('active'));
          planetMaterial.needsUpdate = true;
          document.getElementById('rotation-slider').value = rotationSpeed;
          document.getElementById('opacity-slider').value = planetMaterial.opacity;
          document.getElementById('shininess-slider').value = planetMaterial.shininess;
          terminalContent.innerHTML += `${new Date().toISOString().slice(11, 19)} > Settings reset to default<br>`;
          terminalContent.style.animation = 'none';
          setTimeout(() => {
            terminalContent.style.animation = 'scroll 20s linear infinite';
          }, 10);
          break;
        case 'HUD OFF':
          holoHudVisible = false;
          holoHud.style.display = 'none';
          hexagons[5].classList.remove('active');
          terminalContent.innerHTML += `${new Date().toISOString().slice(11, 19)} > Holo HUD disabled<br>`;
          terminalContent.style.animation = 'none';
          setTimeout(() => {
            terminalContent.style.animation = 'scroll 20s linear infinite';
          }, 10);
          break;
        case 'HUD ON':
          holoHudVisible = true;
          holoHud.style.display = 'block';
          hexagons[5].classList.add('active');
          terminalContent.innerHTML += `${new Date().toISOString().slice(11, 19)} > Holo HUD enabled<br>`;
          terminalContent.style.animation = 'none';
          setTimeout(() => {
            terminalContent.style.animation = 'scroll 20s linear infinite';
          }, 10);
          break;
        default:
          terminalContent.innerHTML += `${new Date().toISOString().slice(11, 19)} > Command '${command}' not recognized<br>`;
          terminalContent.innerHTML += `${new Date().toISOString().slice(11, 19)} > Try: SCAN, ANALYZE, ROTATE FAST/SLOW/STOP, RESET, HUD ON/OFF<br>`;
          terminalContent.style.animation = 'none';
          setTimeout(() => {
            terminalContent.style.animation = 'scroll 20s linear infinite';
          }, 10);
      }
    }

    const ctx = document.getElementById('temp-chart').getContext('2d');
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['1s', '2s', '3s', '4s', '5s', '6s'],
        datasets: [{
          label: 'TEMP (°C)',
          data: [26.8, 27.1, 26.9, 27.0, 26.8, 27.2],
          borderColor: '#00FFFF',
          backgroundColor: 'rgba(0, 255, 255, 0.2)',
          fill: true,
          tension: 0.1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { 
            beginAtZero: false,
            grid: { borderColor: '#333', color: '#333' },
            ticks: { color: '#00FFFF' }
          },
          x: { grid: { borderColor: '#333', color: '#333' }, ticks: { color: '#00FFFF' } }
        },
        plugins: {
          legend: { labels: { color: '#00FFFF',
          boxWidth: 20, // Customize the width of the colored box
          padding: 5 // Customize the padding around the legend items
           } }
        }
      }
    });

    const signalCtx = document.getElementById('signal-chart').getContext('2d');
    let signalData = Array(10).fill(0);
    const signalChart = new Chart(signalCtx, {
      type: 'line',
      data: {
        labels: Array(10).fill(''),
        datasets: [{
          label: 'SIGNAL (dB)',
          data: signalData,
          borderColor: '#00FFFF',
          backgroundColor: 'rgba(0, 255, 255, 0.1)',
          fill: true,
          tension: 0.3,
          pointRadius: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        scales: {
          y: { 
            display: false,
            min: -50,
            max: -30
          },
          x: { display: false }
        },
        plugins: {
          legend: { display: false }
        }
      }
    });

    function updateSignalGraph() {
      signalData.shift();
      signalData.push(currentSignal);
      signalChart.data.datasets[0].data = signalData;
      signalChart.update();
    }
    setInterval(updateSignalGraph, 1000);

    const networkLatency = document.getElementById('network-latency');
    function updateNetworkLatency() {
      const latency = Math.floor(Math.random() * (100 - 30) + 30);
      networkLatency.textContent = `${latency}ms`;
    }
    setInterval(updateNetworkLatency, 3000);
    updateNetworkLatency();

    const rotationSlider = document.getElementById('rotation-slider');
    const opacitySlider = document.getElementById('opacity-slider');
    const shininessSlider = document.getElementById('shininess-slider');

    rotationSlider.addEventListener('input', (e) => {
      rotationSpeed = parseFloat(e.target.value);
      rotationState = rotationSpeed === 0 ? 0 : (rotationSpeed > 0.001 ? 2 : 1);
      hexagons[0].classList.toggle('active', rotationSpeed !== 0);
    });

    opacitySlider.addEventListener('input', (e) => {
      planetMaterial.opacity = parseFloat(e.target.value);
      planetMaterial.needsUpdate = true;
      renderer.render(scene, camera);
    });

    shininessSlider.addEventListener('input', (e) => {
      planetMaterial.shininess = parseFloat(e.target.value);
      planetMaterial.needsUpdate = true;
      renderer.render(scene, camera);
    });

    const encryptedText = document.getElementById('encrypted-text');
    const decryptedText = document.getElementById('decrypted-text');
    const messages = [
      { encrypted: "0xFF12AB4C", decrypted: "ALERT: INCOMING MESSAGE" },
      { encrypted: "0xA1B2C3D4", decrypted: "SYSTEM: CORE STABLE" },
      { encrypted: "0xE5F67489", decrypted: "WARNING: HIGH ENERGY" }
    ];
    let currentMessageIndex = 0;
    let currentCharIndex = 0;
    let isDecrypting = true;

    function updateDecryption() {
      const currentMessage = messages[currentMessageIndex];
      encryptedText.textContent = currentMessage.encrypted;

      if (isDecrypting) {
        if (currentCharIndex < currentMessage.decrypted.length) {
          decryptedText.textContent = currentMessage.decrypted.substring(0, currentCharIndex + 1);
          currentCharIndex++;
        } else {
          isDecrypting = false;
          setTimeout(() => {
            currentCharIndex--;
            isDecrypting = false;
          }, 4000);
        }
      } else {
        if (currentCharIndex >= 0) {
          decryptedText.textContent = currentMessage.decrypted.substring(0, currentCharIndex);
          currentCharIndex--;
        } else {
          isDecrypting = true;
          currentCharIndex = 0;
          currentMessageIndex = (currentMessageIndex + 1) % messages.length;
        }
      }
    }

    setInterval(updateDecryption, 100);

    resizeRenderer();
    animate();

    console.log('Running on:', window.location.href);
    console.log('Note: Request temp access at https://cors-anywhere.herokuapp.com/ for textures.');
    console.log('Audio: Button sound (https://www.soundjay.com/buttons/beep-21.mp3) on hexagon click');
    console.log('Audio: Scan/Analyze sound (https://www.soundjay.com/mechanical/freezer-hum-1.mp3) on SCAN/ANALYZE command, plays for 5 seconds');
    console.log('Audio: Scan/Analyze complete sound (https://www.soundjay.com/mechanical/camera-shutter-click-01.mp3) after scan/analysis finishes');