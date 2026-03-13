(function() {
    // 1. Prevent multiple injections if the script is loaded twice
    if (document.getElementById('my-calc-widget-container')) return;

    // 2. Inject scoped CSS
    const style = document.createElement('style');
    style.innerHTML = `
        #my-calc-widget-container {
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 250px;
            background: #ffffff;
            border-radius: 12px;
            box-shadow: 0 8px 24px rgba(0,0,0,0.15);
            padding: 16px;
            font-family: system-ui, -apple-system, sans-serif;
            z-index: 2147483647; /* Max z-index to stay on top */
            box-sizing: border-box;
            border: 1px solid #e5e7eb;
        }
        #my-calc-widget-container * {
            box-sizing: border-box; /* Prevent host site CSS bleed */
            margin: 0;
            padding: 0;
        }
        #my-calc-widget-container h3 {
            font-size: 16px;
            margin-bottom: 12px;
            color: #111827;
            text-align: center;
        }
        #my-calc-widget-container input {
            width: 100%;
            margin-bottom: 10px;
            padding: 8px;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            font-size: 14px;
        }
        #my-calc-widget-container .calc-buttons {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 8px;
            margin-bottom: 12px;
        }
        #my-calc-widget-container button {
            background: #3b82f6;
            color: white;
            border: none;
            padding: 10px 0;
            border-radius: 6px;
            cursor: pointer;
            font-size: 16px;
            font-weight: bold;
            transition: background 0.2s;
        }
        #my-calc-widget-container button:hover {
            background: #2563eb;
        }
        #my-calc-widget-container #calc-result {
            text-align: center;
            font-weight: 600;
            color: #374151;
            padding: 8px;
            background: #f3f4f6;
            border-radius: 6px;
        }
    `;
    document.head.appendChild(style);

    // 3. Inject HTML UI
    const container = document.createElement('div');
    container.id = 'my-calc-widget-container';
    container.innerHTML = `
        <h3>Mini Calc</h3>
        <input type="number" id="calc-n1" placeholder="First number">
        <input type="number" id="calc-n2" placeholder="Second number">
        <div class="calc-buttons">
            <button data-op="+">+</button>
            <button data-op="-">-</button>
            <button data-op="*">×</button>
            <button data-op="/">÷</button>
        </div>
        <div id="calc-result">Result: -</div>
    `;
    document.body.appendChild(container);

    // 4. Add isolated event listeners (No global variables)
    const buttons = container.querySelectorAll('button');
    const resultEl = container.querySelector('#calc-result');
    const input1 = container.querySelector('#calc-n1');
    const input2 = container.querySelector('#calc-n2');

    buttons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const n1 = parseFloat(input1.value);
            const n2 = parseFloat(input2.value);
            const op = e.target.getAttribute('data-op');

            if (isNaN(n1) || isNaN(n2)) {
                resultEl.textContent = 'Enter valid numbers';
                return;
            }

            let res = 0;
            switch(op) {
                case '+': res = n1 + n2; break;
                case '-': res = n1 - n2; break;
                case '*': res = n1 * n2; break;
                case '/': res = n2 === 0 ? 'Error (Div by 0)' : n1 / n2; break;
            }
            
            // Format to 2 decimal places if needed, else show whole number
            resultEl.textContent = 'Result: ' + (typeof res === 'number' ? Math.round(res * 100) / 100 : res);
        });
    });
})();
