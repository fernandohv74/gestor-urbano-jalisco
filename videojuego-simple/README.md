# Videojuegos sencillos

Dos juegos de navegador, autocontenidos, sin instalar nada.

## 🐍 Snake — `index.html`

Clásico Snake con HTML5 Canvas + JavaScript puro. Cero dependencias.

**Cómo jugarlo:** abre `index.html` directamente en el navegador.

**Controles:** flechas o WASD para moverte, botón "Reiniciar" tras perder.

## ⛏️ Cavador de Oro — `lode-runner.html`

Inspirado en el clásico *Lode Runner* (Broderbund): recorre el nivel por escaleras y cuerdas, cava hoyos en los bloques para atrapar a los guardias, junta todo el oro y sube hasta la salida para ganar. Hecho con [Phaser 3](https://phaser.io/) (se carga desde un CDN, requiere internet la primera vez).

**Cómo jugarlo:** abre `lode-runner.html` directamente en el navegador.

**Controles:**
- Flechas: moverte, subir/bajar escaleras, colgarte y desplazarte por cuerdas.
- `Z`: cavar un hoyo a la izquierda. `X`: cavar un hoyo a la derecha.
- Los hoyos se cierran solos a los pocos segundos — si un guardia queda atrapado dentro, se elimina y da puntos extra.
- Junta las 10 piezas de oro y regresa a la escalera de arriba a la izquierda para completar el nivel.
- `R`: reiniciar cuando ganas o pierdes todas las vidas.

## Estructura

Cada juego vive en un solo archivo `.html` con todo embebido (HTML, CSS y JS). Ideal como base para modificar reglas, niveles, velocidad o agregar más mecánicas.
