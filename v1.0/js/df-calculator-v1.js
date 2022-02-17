// DF Calculator v1
// © defreeart
// https://github.com/defreeart

function DFCalculator(props) {
    const defaults = {
        scriptName: 'DFCalculator',
        attr: 'data-entry',
        history: 'df-calculator-first-display',
        panel: 'df-calculator-second-display'
    }

    window.addEventListener('load', () => {
        if (!isType('Object', props)) props = {};
        merge(props, defaults);
        runDFCalculator(props);
    });

    function isType(name, object) {
        let type = Object.prototype.toString.call(object);
        return type === `[object ${name}]`;
    }

    function merge(props, options) {
        for (let key in options) {
            let none = props[key] === undefined;
            if (none) props[key] = options[key];
        }
    }
}

function runDFCalculator(props) {
    let name = {
        selectors: {
            panel: `.${props.panel}`,
            history: `.${props.history}`
        },
        collections: {
            entries: `[${props.attr}]`
        }
    }

    let data = {
        expression: [],
        number: '0',
        operators: [
            '+', '-', '*', '/', '%',
            'sqrt', 'sqr', 'root',
            'sin', 'cos', 'tan',
            '^', 'log', 'ln', 'n!',
            'equal'
        ],
        exponential: Math.pow(10, 12)
    }

    let set = {};

    class Init {
        main() {
            if (!this.writeSelectors()) return;
            new Controller().main();
        }

        writeSelectors() {
            let {selectors, collections} = name;
            if (!this.writeGroup(selectors, 1)) return;
            if (!this.writeGroup(collections)) return;
            return true;
        }

        writeGroup(object, n) {
            for (let key in object) {
                let selector = object[key];
                let node = this.getNodes(selector, n);
                let none = !node || node.length === 0;
                if (none) return this.isNotFound(key);
                data[key] = node;
            }
            return true;
        }

        getNodes(e, i, c) {
            let container = c || document;
            let a = container.querySelector(e);
            let b = container.querySelectorAll(e);
            return (i == 1) ? a : b;
        }

        isNotFound(item) {
            let s = `${props.scriptName}: `;
            s += `No ${item}. `;
            s += `Check the code and the class names`;
            console.warn(s);
        }
    }

    class Controller {
        main() {
            this.writeLogic();
            this.runLogic();
        }

        writeLogic() {
            data.control = {
                calculator: new Calculator()
            }
        }

        runLogic() {
            data.control.calculator.main();
        }
    }

    class Calculator {
        main() {
            data.panel.value = data.number;
            data.entries.forEach(node => {
                node.addEventListener('click', e => {
                    e.preventDefault();
                    this.createExpression(node);
                });
            });
        }

        createExpression(node) {
            let attr = node.getAttribute(props.attr);
            let special = new Special(attr);
            let value = new Value(attr);
            let operator = new Operator(attr);
            if (special.parse()) return;
            if (value.parse()) return;
            operator.parse();
        }
    }

    class Value extends Calculator {
        constructor(attribute) {
            super();
            this.attribute = attribute;
        }

        parse() {
            if (!this.isValue()) return false;
            this.dropNumber();
            if (this.isSecondDot()) return true;
            if (this.isLongNumber()) return true;
            this.unlockOperator();
            this.addSymbol();
            return true;
        }

        isValue() {
            let a = !isNaN(parseFloat(this.attribute));
            let b = this.attribute === '.';
            return a || b;
        }

        isSecondDot() {
            if (this.attribute !== '.') return;
            return data.number.includes('.');
        }

        isLongNumber() {
            return data.number.length >= 26;
        }

        dropNumber() {
            if (!set.number) return;
            data.number = '0';
            set.number = false;
        }

        unlockOperator() {
            if (set.operator) set.operator = false;
        }

        addSymbol() {
            let n = data.number;
            let a = this.attribute;
            (n === '0' && a !== '.') ? n = a : n += a;
            data.number = n;
            data.panel.value = n;
        }
    }

    class Operator extends Calculator {
        constructor(attribute) {
            super();
            this.attribute = attribute;
        }

        parse() {
            if (!this.isOperator()) return console.warn(`${props.scriptName}: ${this.attribute} is not defined`);
            data.number = this.removeExtraSymbols(data.number);
            set.number = true;
            if (this.isModifier()) return;
            this.wasUniqueOperator();
            (set.operator) ? this.replaceOperator() : this.makeUnit();
            this.updateHistory();
            this.isEqual();
        }

        isOperator() {
            let o = data.operators;
            let a = this.attribute;
            let index = o.findIndex(i => i === a);
            return index >= 0;
        }

        removeExtraSymbols(n) {
            if (!this.isFiniteAndNotExp(n)) return n;
            return parseFloat(n) + '';
        }

        isModifier() {
            if (this.parseSci('%', () => {
                let e = data.expression;
                if (e.length < 1) return false;
                let x = e[e.length - 1].number;
                let y = data.number;
                let percent = x * y / 100;
                data.number = percent;
            })) return true;

            if (this.parseSci('sqr', () => {
                data.number *= data.number;
            })) return true;

            if (this.parseSci('sqrt', () => {
                data.number = Math.sqrt(data.number);
            })) return true;

            if (this.parseSci('ln', () => {
                data.number = Math.log(data.number);
            })) return true;

            if (this.parseSci('log', () => {
                data.number = Math.LOG10E * Math.log(data.number);
            })) return true;

            if (this.parseSci('n!', () => {
                data.number = this.factorial(data.number);
            })) return true;

            if (this.parseSci('sin', () => {
                data.number = Math.sin(data.number);
            })) return true;

            if (this.parseSci('cos', () => {
                data.number = Math.cos(data.number);
            })) return true;

            if (this.parseSci('tan', () => {
                data.number = Math.tan(data.number);
            })) return true;
        }

        parseSci(a, sentFunction) {
            if (this.attribute !== a) return false;
            if (set.operator) return true;
            data.number = parseFloat(data.number);
            sentFunction();
            data.number = this.fixLong(data.number);
            data.panel.value = data.number;
            return true;
        }

        wasUniqueOperator() {
            if (set.operator) return;
            this.parseUnique('^', Math.pow);
            this.parseUnique('root', this.nthroot);
        }

        nthroot(x, n) {
            let a = x < 0 && n % 2 == 1;
            if (a) x = Math.abs(x);
            let result = Math.pow(x, 1 / n);
            return (a) ? -1 * result : result;
        }

        parseUnique(a, sentFunction) {
            let e = data.expression;
            let unit = e[e.length - 1];
            if (!unit) return false;
            if (unit.operator !== a) return false;
            unit.number = parseFloat(unit.number);
            unit.number = sentFunction(unit.number, data.number);
            unit.number = this.fixLong(unit.number);
            data.panel.value = unit.number;
            set.operator = true;
            return true;
        }

        replaceOperator() {
            let e = data.expression;
            e[e.length - 1].operator = this.attribute;
        }

        factorial(n) {
            if (!this.isFiniteAndNotExp(n)) return NaN;
            if (n < 0) return NaN;
            if (n == 0) return 1;
            if (n == parseInt(n)) return this.factorialInt(n);
            return this.factorialDecimal(n);
        }

        factorialInt(n) {
            let fixed = n;
            for (let i = fixed; i >= 2; i--) {
                n = n * (i - 1);
            }
            return n;
        }

        factorialDecimal(n) {
            var g = 7;
            var C = [0.99999999999980993, 676.5203681218851, -1259.1392167224028,771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];

            return gamma(n + 1);

            function gamma(z) {
                if (z < 0.5) return Math.PI / (Math.sin(Math.PI * z) * gamma(1 - z));
                else {
                    z -= 1;
                    var x = C[0];
                    for (var i = 1; i < g + 2; i++)
                    x += C[i] / (z + i);
                    var t = z + g + 0.5;
                    return Math.sqrt(2 * Math.PI) * Math.pow(t, (z + 0.5)) * Math.exp(-t) * x;
                }
            }
        }

        makeUnit() {
            let unit = new Unit(data.number, this.attribute);
            data.expression.push(unit);
            set.operator = true;
        }

        updateHistory() {
            let string = [];
            data.expression.forEach(unit => {
                for (let key in unit) {
                    if (unit[key] === 'equal') return;
                    string.push(unit[key]);
                }
            });
            string = string.join(' ');
            data.history.value = string;
        }

        isEqual() {
            if (this.attribute === 'equal') {
                this.calculateResult();
                data.expression = [];
            }
        }

        calculateResult() {
            set = {};
            let string = [];
            data.expression.forEach(block => {
                for (let key in block) {
                    if (block[key] === 'equal') {
                        string = string.join('');
                        string = this.fixMinuses(string);
                        this.runEvaluation(string);
                        return;
                    }
                    string.push(block[key]);
                }
            });
        }

        fixMinuses(n) {
            return n.replace('--', '+');
        }

        runEvaluation(n) {
            let result = eval(n);
            set.number = true;
            result = this.fixLong(result);
            data.number = result;
            data.panel.value = data.number;
        }

        isFiniteAndNotExp(n) {
            let a = isFinite(parseFloat(n));
            let b = n <= data.exponential;
            return a && b;
        }

        fixLong(n) {
            if (isFinite(n)) {
                n = parseFloat(n.toFixed(12));
                if (n > data.exponential) {
                    n = n.toExponential(12);
                }
            }
            return n + '';
        }
    }

    class Special extends Operator {
        constructor(attribute) {
            super();
            this.attribute = attribute;
        }

        parse() {
            switch (this.attribute) {
                case 'clear':
                    this.clearAll();
                    return true;
                case 'del':
                    this.runTemplate(n => {
                        return this.deleteSymbol(n);
                    });
                    return true;
                case '+-':
                    this.runTemplate(n => {
                        return this.toggleMinus(n);
                    });
                    return true;
                default:
                    return false;
            }
        }

        runTemplate(sentFunction) {
            if (set.operator) return;
            if (set.number) return;
            data.number = sentFunction(data.number);
            data.panel.value = data.number;
        }

        clearAll() {
            set = {};
            data.expression = [];
            data.number = '0';
            data.panel.value = data.number;
            data.history.value = '';
        }

        deleteSymbol(n) {
            if (!this.isFiniteAndNotExp(n)) return n;
            n = (n.length > 1) ? n.slice(0, -1) : '0';
            if (isNaN(parseFloat(n))) n = '0';
            return n;
        }

        toggleMinus(n) {
            if (!this.isFiniteAndNotExp(n)) return n;
            if (parseFloat(n) == 0) return n;
            if (parseFloat(n) < 0) return Math.abs(n);
            return '-' + n;
        }
    }

    class Unit {
        constructor(number, operator) {
            this.number = number;
            this.operator = operator;
        }
    }

    new Init().main();
}