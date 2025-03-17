const container = document.getElementById('sphere-container');
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.z = 7.8;

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
    // const proxy = 'https://cors-anywhere.herokuapp.com/';
    const textures = {
      sun: textureLoader.load(`images/2k_sun.jpg`),
      mercury: textureLoader.load(`images/2k_mercury.jpg`),
      venus: textureLoader.load(`images/2k_venus_surface.jpg`),
      earth: textureLoader.load(`images/2k_earth_daymap.jpg`, 
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
      mars: textureLoader.load(`images/2k_mars.jpg`),
      jupiter: textureLoader.load(`images/2k_jupiter.jpg`),
      saturn: textureLoader.load(`images/2k_saturn.jpg`),
      uranus: textureLoader.load(`images/2k_uranus.jpg`),
      neptune: textureLoader.load(`images/2k_neptune.jpg`),
      moon: textureLoader.load(`images/2k_moon.jpg`)
    };

    const geometry = new THREE.SphereGeometry(3.25, 32, 32);
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
wireframeMesh.scale.set(0.98, 0.98, 0.98); // Add this line to make wireframe slightly smaller

const planetSphere = new THREE.Mesh(geometry, planetMaterial);
const sphereGroup = new THREE.Group();
sphereGroup.add(wireframeMesh);
sphereGroup.add(planetSphere);

const orbitGeometry = new THREE.TorusGeometry(4.875, 0.001, 16, 100);
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

    document.getElementById('planet-select').addEventListener('change', function(e) {
    const solarEffect = document.getElementById('solar-effect');
    
    if (e.target.value === 'sun') {
        solarEffect.classList.add('active');
    } else {
        solarEffect.classList.remove('active');
    }
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
      
      // Remove or comment out the pulsing animation
      // const pulseScale = 1 + 0.05 * Math.sin(Date.now() * 0.001);
      // planetSphere.scale.set(pulseScale, pulseScale, pulseScale);
      
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
      // Set case 1 elements to be initially hidden
      if (index === 1) {
        crosshairOverlayVisible = false;
        orbitalPathVisible = false;
        crosshairOverlay.style.display = 'none';
        orbit.visible = false;
        hex.classList.remove('active');
      }
      
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
      "ALERT: GRAVITATIONAL ANOMALY DETECTED",
      "WARNING: UNUSUAL ENERGY SIGNATURE DETECTED",
      "CAUTION: THERMAL SPIKE DETECTED",
      "ERROR: UNKNOWN SIGNAL INTERFERENCE",
      "NOTICE: CORE STABILITY FLUCTUATING",
      "SCANNING... 34%, SCANNING... 69%, ANALYZING..."
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
    

    // const rotationSlider = document.getElementById('rotation-slider');
    // const opacitySlider = document.getElementById('opacity-slider');
    // const shininessSlider = document.getElementById('shininess-slider');

    // rotationSlider.addEventListener('input', (e) => {
    //   rotationSpeed = parseFloat(e.target.value);
    //   rotationState = rotationSpeed === 0 ? 0 : (rotationSpeed > 0.001 ? 2 : 1);
    //   hexagons[0].classList.toggle('active', rotationSpeed !== 0);
    // });

    // opacitySlider.addEventListener('input', (e) => {
    //   planetMaterial.opacity = parseFloat(e.target.value);
    //   planetMaterial.needsUpdate = true;
    //   renderer.render(scene, camera);
    // });

    // shininessSlider.addEventListener('input', (e) => {
    //   planetMaterial.shininess = parseFloat(e.target.value);
    //   planetMaterial.needsUpdate = true;
    //   renderer.render(scene, camera);
    // });


    // Comment out decryptor element references and logic
    /*
    const encryptedText = document.getElementById('encrypted-text');
    const decryptedText = document.getElementById('decrypted-text');
    const messages = [
      { encrypted: "0xFF12AB4C", decrypted: "ALERT: ORBITAL STABILITY AT RISK" },
      { encrypted: "0xA1B2C3D4", decrypted: "WARNING: SHIELD INTEGRITY COMPROMISED" },
      { encrypted: "0xE5F67489", decrypted: "CAUTION: CORE STABILITY AT RISK" },
      { encrypted: "0xA1B2C345", decrypted: "ERROR: COMMUNICATIONS OFFLINE" },
      { encrypted: "0xH2F67189", decrypted: "NOTICE: ENERGY LEVELS CRITICAL" },
      { encrypted: "0xH2F67189", decrypted: "SCANNING... 34%, SCANNING... 69%, ANALYZING... 100%" },
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
    */

    resizeRenderer();
    animate();

    console.log('Running on:', window.location.href);
    console.log('Note: To see planet textures request temp access via https://cors-anywhere.herokuapp.com/');

function initNeuralNetwork() {
  const canvas = document.getElementById('neural-canvas');
  const ctx = canvas.getContext('2d');
  
  // Set canvas size with proper scaling
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);
  
  const nodes = [];
  const connections = [];
  
  // Create nodes
  for (let i = 0; i < 15; i++) {
    nodes.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 2 + 1,
      speed: Math.random() * 0.5 + 0.1
    });
  }
  
  // Create connections
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      if (Math.random() > 0.25) {
        connections.push([i, j]);
      }
    }
  }
  
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Update and draw connections
    ctx.beginPath();
    connections.forEach(([i, j]) => {
      const dx = nodes[i].x - nodes[j].x;
      const dy = nodes[i].y - nodes[j].y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < 100) {
        ctx.moveTo(nodes[i].x, nodes[i].y);
        ctx.lineTo(nodes[j].x, nodes[j].y);
        
        const alpha = 1 - distance / 100;
        ctx.strokeStyle = `rgba(0, 255, 255, ${alpha * 0.2})`;
        ctx.stroke();
      }
    });
    
    // Update and draw nodes
    nodes.forEach(node => {
      node.x += Math.sin(Date.now() * 0.001 * node.speed) * 0.1;
      node.y += Math.cos(Date.now() * 0.001 * node.speed) * 0.1;
      
      if (node.x < 0) node.x = canvas.width;
      if (node.x > canvas.width) node.x = 0;
      if (node.y < 0) node.y = canvas.height;
      if (node.y > canvas.height) node.y = 0;
      
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
      ctx.fillStyle = '#FF4800';
      ctx.fill();
    });
    
    requestAnimationFrame(animate);
  }
  
  animate();
  
  // Update stats periodically
  setInterval(() => {
    document.getElementById('active-nodes').textContent = 
      (2000 + Math.floor(Math.random() * 1000)).toLocaleString();
    document.getElementById('active-synapses').textContent = 
      (12000 + Math.floor(Math.random() * 2000)).toLocaleString();
    document.getElementById('neural-efficiency').textContent = 
      (90 + Math.random() * 9.9).toFixed(1) + '%';
  }, 2000);
}

// Add this to your existing window.onload or initialization code
window.addEventListener('load', initNeuralNetwork);

/* CORS fix */

(function() {
  var cors_api_host = 'cors-anywhere.herokuapp.com';
  var cors_api_url = 'https://' + cors_api_host + '/';
  var slice = [].slice;
  var origin = window.location.protocol + '//' + window.location.host;
  var open = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function() {
      var args = slice.call(arguments);
      var targetOrigin = /^https?:\/\/([^\/]+)/i.exec(args[1]);
      if (targetOrigin && targetOrigin[0].toLowerCase() !== origin &&
          targetOrigin[1] !== cors_api_host) {
          args[1] = cors_api_url + args[1];
      }
      return open.apply(this, args);
  };
})();

// function updateQuantumMetrics() {
//   const entanglement = document.getElementById('entanglement-value');
//   const qbits = document.getElementById('qbits-value');
  
//   // Random fluctuation in entanglement between 90-99.9%
//   const entanglementValue = (90 + Math.random() * 9.9).toFixed(1);
//   entanglement.textContent = `${entanglementValue}%`;
  
//   // Random fluctuation in qbits between 3,500-4,500
//   const qbitValue = Math.floor(3500 + Math.random() * 1000);
//   qbits.textContent = qbitValue.toLocaleString();
  
//   // Add warning class if entanglement drops below 92%
//   if (parseFloat(entanglementValue) < 92) {
//     entanglement.classList.add('warning-value');
//   } else {
//     entanglement.classList.remove('warning-value');
//   }
// }

// // Update quantum metrics every 2 seconds
// setInterval(updateQuantumMetrics, 2000);

function initDimensionalAnalysis() {
  const canvas = document.getElementById('dimension-viewer');
  const ctx = canvas.getContext('2d');
  
  // Set canvas size with proper scaling
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);
  
  const points = [];
  for (let i = 0; i < 50; i++) {
    points.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      z: Math.random() * 100,
      // Reduce speed range from 2 to 0.5
      speed: Math.random() * 0.5 + 0.1  // Changed from 2 + 1
    });
  }
  
  function animate() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    points.forEach(point => {
      // Reduce z-axis movement speed
      point.z += point.speed * 0.5;  // Added * 0.5 to slow down
      if (point.z > 100) point.z = 0;
      
      const scale = point.z / 100;
      const x = point.x + (canvas.width/2 - point.x) * scale;
      const y = point.y + (canvas.height/2 - point.y) * scale;
      
      ctx.beginPath();
      ctx.arc(x, y, scale * 3, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0, 255, 255, ${1 - scale})`;
      ctx.fill();
    });
    
    requestAnimationFrame(animate);
  }
  
  animate();
  
  // Update dimensional metrics
  function updateMetrics() {
    const phaseShift = document.getElementById('phase-shift-value');
    const membrane = document.getElementById('membrane-status');
    const resonance = document.getElementById('resonance-value');
    
    // Random phase shift between 0.0001π and 0.01π
    const phaseValue = (Math.random() * 0.01).toFixed(4);
    phaseShift.textContent = `${phaseValue}π`;
    
    // Random membrane status
    const membraneStability = Math.random();
    if (membraneStability < 0.1) {
      membrane.textContent = 'BREACH';
      membrane.classList.add('breach');
    } else {
      membrane.textContent = 'STABLE';
      membrane.classList.remove('breach');
    }
    
    // Random resonance between 85% and 99%
    const resonanceValue = (85 + Math.random() * 14).toFixed(1);
    resonance.textContent = `${resonanceValue}%`;
    
    // Add warning class if phase shift is too high
    if (parseFloat(phaseValue) > 0.005) {
      phaseShift.classList.add('unstable');
    } else {
      phaseShift.classList.remove('unstable');
    }
  }
  
  // Increase update interval from 3000 to 5000ms
  setInterval(updateMetrics, 5000);  // Changed from 3000
}

// Add to your existing initialization code
window.addEventListener('load', initDimensionalAnalysis);