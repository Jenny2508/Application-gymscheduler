
(function(l, i, v, e) { v = l.createElement(i); v.async = 1; v.src = '//' + (location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; e = l.getElementsByTagName(i)[0]; e.parentNode.insertBefore(v, e)})(document, 'script');
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else
            node.setAttribute(attribute, value);
    }
    function to_number(value) {
        return value === '' ? undefined : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_data(text, data) {
        data = '' + data;
        if (text.data !== data)
            text.data = data;
    }
    function select_option(select, value) {
        for (let i = 0; i < select.options.length; i += 1) {
            const option = select.options[i];
            if (option.__value === value) {
                option.selected = true;
                return;
            }
        }
    }
    function select_value(select) {
        const selected_option = select.querySelector(':checked') || select.options[0];
        return selected_option && selected_option.__value;
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function createEventDispatcher() {
        const component = current_component;
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }

    const dirty_components = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function flush() {
        const seen_callbacks = new Set();
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.shift()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            while (render_callbacks.length) {
                const callback = render_callbacks.pop();
                if (!seen_callbacks.has(callback)) {
                    callback();
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                }
            }
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
    }
    function update($$) {
        if ($$.fragment) {
            $$.update($$.dirty);
            run_all($$.before_render);
            $$.fragment.p($$.dirty, $$.ctx);
            $$.dirty = null;
            $$.after_render.forEach(add_render_callback);
        }
    }
    let outros;
    function group_outros() {
        outros = {
            remaining: 0,
            callbacks: []
        };
    }
    function check_outros() {
        if (!outros.remaining) {
            run_all(outros.callbacks);
        }
    }
    function on_outro(callback) {
        outros.callbacks.push(callback);
    }

    function destroy_block(block, lookup) {
        block.d(1);
        lookup.delete(block.key);
    }
    function update_keyed_each(old_blocks, changed, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
        let o = old_blocks.length;
        let n = list.length;
        let i = o;
        const old_indexes = {};
        while (i--)
            old_indexes[old_blocks[i].key] = i;
        const new_blocks = [];
        const new_lookup = new Map();
        const deltas = new Map();
        i = n;
        while (i--) {
            const child_ctx = get_context(ctx, list, i);
            const key = get_key(child_ctx);
            let block = lookup.get(key);
            if (!block) {
                block = create_each_block(key, child_ctx);
                block.c();
            }
            else if (dynamic) {
                block.p(changed, child_ctx);
            }
            new_lookup.set(key, new_blocks[i] = block);
            if (key in old_indexes)
                deltas.set(key, Math.abs(i - old_indexes[key]));
        }
        const will_move = new Set();
        const did_move = new Set();
        function insert(block) {
            if (block.i)
                block.i(1);
            block.m(node, next);
            lookup.set(block.key, block);
            next = block.first;
            n--;
        }
        while (o && n) {
            const new_block = new_blocks[n - 1];
            const old_block = old_blocks[o - 1];
            const new_key = new_block.key;
            const old_key = old_block.key;
            if (new_block === old_block) {
                // do nothing
                next = new_block.first;
                o--;
                n--;
            }
            else if (!new_lookup.has(old_key)) {
                // remove old block
                destroy(old_block, lookup);
                o--;
            }
            else if (!lookup.has(new_key) || will_move.has(new_key)) {
                insert(new_block);
            }
            else if (did_move.has(old_key)) {
                o--;
            }
            else if (deltas.get(new_key) > deltas.get(old_key)) {
                did_move.add(new_key);
                insert(new_block);
            }
            else {
                will_move.add(old_key);
                o--;
            }
        }
        while (o--) {
            const old_block = old_blocks[o];
            if (!new_lookup.has(old_block.key))
                destroy(old_block, lookup);
        }
        while (n)
            insert(new_blocks[n - 1]);
        return new_blocks;
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_render } = component.$$;
        fragment.m(target, anchor);
        // onMount happens after the initial afterUpdate. Because
        // afterUpdate callbacks happen in reverse order (inner first)
        // we schedule onMount callbacks before afterUpdate callbacks
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_render.forEach(add_render_callback);
    }
    function destroy(component, detaching) {
        if (component.$$) {
            run_all(component.$$.on_destroy);
            component.$$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            component.$$.on_destroy = component.$$.fragment = null;
            component.$$.ctx = {};
        }
    }
    function make_dirty(component, key) {
        if (!component.$$.dirty) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty = blank_object();
        }
        component.$$.dirty[key] = true;
    }
    function init(component, options, instance, create_fragment, not_equal$$1, prop_names) {
        const parent_component = current_component;
        set_current_component(component);
        const props = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props: prop_names,
            update: noop,
            not_equal: not_equal$$1,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_render: [],
            after_render: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty: null
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, props, (key, value) => {
                if ($$.ctx && not_equal$$1($$.ctx[key], $$.ctx[key] = value)) {
                    if ($$.bound[key])
                        $$.bound[key](value);
                    if (ready)
                        make_dirty(component, key);
                }
            })
            : props;
        $$.update();
        ready = true;
        run_all($$.before_render);
        $$.fragment = create_fragment($$.ctx);
        if (options.target) {
            if (options.hydrate) {
                $$.fragment.l(children(options.target));
            }
            else {
                $$.fragment.c();
            }
            if (options.intro && component.$$.fragment.i)
                component.$$.fragment.i();
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy(this, true);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
    }

    /* src\components\TrainingDayDetails.svelte generated by Svelte v3.4.4 */

    const file = "src\\components\\TrainingDayDetails.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.ex = list[i];
    	return child_ctx;
    }

    // (63:6) {#each exercises as ex}
    function create_each_block(ctx) {
    	var li, t0_value = ctx.ex.activity, t0, t1, t2_value = ctx.ex.sets, t2, t3, t4_value = ctx.ex.reps, t4, t5;

    	return {
    		c: function create() {
    			li = element("li");
    			t0 = text(t0_value);
    			t1 = text(": ");
    			t2 = text(t2_value);
    			t3 = text(" sets of ");
    			t4 = text(t4_value);
    			t5 = text(" reps");
    			add_location(li, file, 63, 8, 1316);
    		},

    		m: function mount(target, anchor) {
    			insert(target, li, anchor);
    			append(li, t0);
    			append(li, t1);
    			append(li, t2);
    			append(li, t3);
    			append(li, t4);
    			append(li, t5);
    		},

    		p: function update(changed, ctx) {
    			if ((changed.exercises) && t0_value !== (t0_value = ctx.ex.activity)) {
    				set_data(t0, t0_value);
    			}

    			if ((changed.exercises) && t2_value !== (t2_value = ctx.ex.sets)) {
    				set_data(t2, t2_value);
    			}

    			if ((changed.exercises) && t4_value !== (t4_value = ctx.ex.reps)) {
    				set_data(t4, t4_value);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(li);
    			}
    		}
    	};
    }

    function create_fragment(ctx) {
    	var div5, h2, t0, t1, div3, form, div0, label0, t3, input0, t4, div1, label1, t6, input1, t7, div2, label2, t9, input2, t10, button, t12, div4, ul, dispose;

    	var each_value = ctx.exercises;

    	var each_blocks = [];

    	for (var i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	return {
    		c: function create() {
    			div5 = element("div");
    			h2 = element("h2");
    			t0 = text(ctx.title);
    			t1 = space();
    			div3 = element("div");
    			form = element("form");
    			div0 = element("div");
    			label0 = element("label");
    			label0.textContent = "Activity";
    			t3 = space();
    			input0 = element("input");
    			t4 = space();
    			div1 = element("div");
    			label1 = element("label");
    			label1.textContent = "Sets";
    			t6 = space();
    			input1 = element("input");
    			t7 = space();
    			div2 = element("div");
    			label2 = element("label");
    			label2.textContent = "Reps";
    			t9 = space();
    			input2 = element("input");
    			t10 = space();
    			button = element("button");
    			button.textContent = "add exercise";
    			t12 = space();
    			div4 = element("div");
    			ul = element("ul");

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}
    			add_location(h2, file, 42, 2, 701);
    			label0.htmlFor = "activity";
    			add_location(label0, file, 46, 8, 797);
    			attr(input0, "type", "text");
    			input0.id = "activity";
    			add_location(input0, file, 47, 8, 844);
    			add_location(div0, file, 45, 6, 783);
    			label1.htmlFor = "sets";
    			add_location(label1, file, 50, 8, 944);
    			attr(input1, "type", "number");
    			input1.id = "sets";
    			add_location(input1, file, 51, 8, 983);
    			add_location(div1, file, 49, 6, 930);
    			label2.htmlFor = "reps";
    			add_location(label2, file, 54, 8, 1077);
    			attr(input2, "type", "number");
    			input2.id = "reps";
    			add_location(input2, file, 55, 8, 1116);
    			add_location(div2, file, 53, 6, 1063);
    			button.type = "submit";
    			add_location(button, file, 57, 6, 1196);
    			add_location(form, file, 44, 4, 730);
    			add_location(div3, file, 43, 2, 720);
    			add_location(ul, file, 61, 4, 1273);
    			add_location(div4, file, 60, 2, 1263);
    			add_location(div5, file, 41, 0, 693);

    			dispose = [
    				listen(input0, "input", ctx.input0_input_handler),
    				listen(input1, "input", ctx.input1_input_handler),
    				listen(input2, "input", ctx.input2_input_handler),
    				listen(form, "submit", prevent_default(ctx.handleSubmit))
    			];
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, div5, anchor);
    			append(div5, h2);
    			append(h2, t0);
    			append(div5, t1);
    			append(div5, div3);
    			append(div3, form);
    			append(form, div0);
    			append(div0, label0);
    			append(div0, t3);
    			append(div0, input0);

    			input0.value = ctx.exercise.activity;

    			append(form, t4);
    			append(form, div1);
    			append(div1, label1);
    			append(div1, t6);
    			append(div1, input1);

    			input1.value = ctx.exercise.sets;

    			append(form, t7);
    			append(form, div2);
    			append(div2, label2);
    			append(div2, t9);
    			append(div2, input2);

    			input2.value = ctx.exercise.reps;

    			append(form, t10);
    			append(form, button);
    			append(div5, t12);
    			append(div5, div4);
    			append(div4, ul);

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}
    		},

    		p: function update(changed, ctx) {
    			if (changed.title) {
    				set_data(t0, ctx.title);
    			}

    			if (changed.exercise && (input0.value !== ctx.exercise.activity)) input0.value = ctx.exercise.activity;
    			if (changed.exercise) input1.value = ctx.exercise.sets;
    			if (changed.exercise) input2.value = ctx.exercise.reps;

    			if (changed.exercises) {
    				each_value = ctx.exercises;

    				for (var i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}
    				each_blocks.length = each_value.length;
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div5);
    			}

    			destroy_each(each_blocks, detaching);

    			run_all(dispose);
    		}
    	};
    }

    function instance($$self, $$props, $$invalidate) {
    	const dispatch = createEventDispatcher();

      let { title } = $$props;
      let exercise = {
        activity: "",
        sets: 4,
        reps: 10
      };

      let exercises = [];

      function handleSubmit() {
        $$invalidate('exercises', exercises = [...exercises, { ...exercise }]);
        dispatch("add-exercise", { ...exercise, title: title });
        // reset
        $$invalidate('exercise', exercise = {
          activity: "",
          sets: 4,
          reps: 10
        });
      }

    	const writable_props = ['title'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<TrainingDayDetails> was created with unknown prop '${key}'`);
    	});

    	function input0_input_handler() {
    		exercise.activity = this.value;
    		$$invalidate('exercise', exercise);
    	}

    	function input1_input_handler() {
    		exercise.sets = to_number(this.value);
    		$$invalidate('exercise', exercise);
    	}

    	function input2_input_handler() {
    		exercise.reps = to_number(this.value);
    		$$invalidate('exercise', exercise);
    	}

    	$$self.$set = $$props => {
    		if ('title' in $$props) $$invalidate('title', title = $$props.title);
    	};

    	return {
    		title,
    		exercise,
    		exercises,
    		handleSubmit,
    		input0_input_handler,
    		input1_input_handler,
    		input2_input_handler
    	};
    }

    class TrainingDayDetails extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, ["title"]);

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.title === undefined && !('title' in props)) {
    			console.warn("<TrainingDayDetails> was created without expected prop 'title'");
    		}
    	}

    	get title() {
    		throw new Error("<TrainingDayDetails>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<TrainingDayDetails>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\TrainingWeekSummary.svelte generated by Svelte v3.4.4 */

    const file$1 = "src\\components\\TrainingWeekSummary.svelte";

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.ex = list[i];
    	return child_ctx;
    }

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.day = list[i];
    	return child_ctx;
    }

    // (30:0) {#if isDataFormatted}
    function create_if_block(ctx) {
    	var h2, t_1, if_block_anchor;

    	function select_block_type(ctx) {
    		if (ctx.summary.length) return create_if_block_1;
    		return create_else_block;
    	}

    	var current_block_type = select_block_type(ctx);
    	var if_block = current_block_type(ctx);

    	return {
    		c: function create() {
    			h2 = element("h2");
    			h2.textContent = "Summary";
    			t_1 = space();
    			if_block.c();
    			if_block_anchor = empty();
    			add_location(h2, file$1, 30, 2, 578);
    		},

    		m: function mount(target, anchor) {
    			insert(target, h2, anchor);
    			insert(target, t_1, anchor);
    			if_block.m(target, anchor);
    			insert(target, if_block_anchor, anchor);
    		},

    		p: function update(changed, ctx) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(changed, ctx);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);
    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(h2);
    				detach(t_1);
    			}

    			if_block.d(detaching);

    			if (detaching) {
    				detach(if_block_anchor);
    			}
    		}
    	};
    }

    // (37:2) {:else}
    function create_else_block(ctx) {
    	var div;

    	return {
    		c: function create() {
    			div = element("div");
    			div.textContent = "Missing data: please add exercises";
    			add_location(div, file$1, 37, 4, 808);
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    		},

    		p: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}
    		}
    	};
    }

    // (32:2) {#if summary.length}
    function create_if_block_1(ctx) {
    	var each_1_anchor;

    	var each_value = ctx.Object.keys(ctx.formattedData);

    	var each_blocks = [];

    	for (var i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	return {
    		c: function create() {
    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},

    		m: function mount(target, anchor) {
    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert(target, each_1_anchor, anchor);
    		},

    		p: function update(changed, ctx) {
    			if (changed.formattedData || changed.Object) {
    				each_value = ctx.Object.keys(ctx.formattedData);

    				for (var i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}
    				each_blocks.length = each_value.length;
    			}
    		},

    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);

    			if (detaching) {
    				detach(each_1_anchor);
    			}
    		}
    	};
    }

    // (35:6) {#each formattedData[day] as ex}
    function create_each_block_1(ctx) {
    	var t0_value = ctx.ex.activity, t0, t1, t2_value = ctx.ex.sets, t2, t3, t4_value = ctx.ex.reps, t4, t5, br;

    	return {
    		c: function create() {
    			t0 = text(t0_value);
    			t1 = text(": ");
    			t2 = text(t2_value);
    			t3 = text(" sets of ");
    			t4 = text(t4_value);
    			t5 = text(" reps");
    			br = element("br");
    			add_location(br, file$1, 34, 85, 770);
    		},

    		m: function mount(target, anchor) {
    			insert(target, t0, anchor);
    			insert(target, t1, anchor);
    			insert(target, t2, anchor);
    			insert(target, t3, anchor);
    			insert(target, t4, anchor);
    			insert(target, t5, anchor);
    			insert(target, br, anchor);
    		},

    		p: function update(changed, ctx) {
    			if ((changed.formattedData) && t0_value !== (t0_value = ctx.ex.activity)) {
    				set_data(t0, t0_value);
    			}

    			if ((changed.formattedData) && t2_value !== (t2_value = ctx.ex.sets)) {
    				set_data(t2, t2_value);
    			}

    			if ((changed.formattedData) && t4_value !== (t4_value = ctx.ex.reps)) {
    				set_data(t4, t4_value);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(t0);
    				detach(t1);
    				detach(t2);
    				detach(t3);
    				detach(t4);
    				detach(t5);
    				detach(br);
    			}
    		}
    	};
    }

    // (33:4) {#each Object.keys(formattedData) as day}
    function create_each_block$1(ctx) {
    	var h2, t0_value = ctx.day, t0, t1, each_1_anchor;

    	var each_value_1 = ctx.formattedData[ctx.day];

    	var each_blocks = [];

    	for (var i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	return {
    		c: function create() {
    			h2 = element("h2");
    			t0 = text(t0_value);
    			t1 = space();

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    			add_location(h2, file$1, 33, 6, 670);
    		},

    		m: function mount(target, anchor) {
    			insert(target, h2, anchor);
    			append(h2, t0);
    			insert(target, t1, anchor);

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert(target, each_1_anchor, anchor);
    		},

    		p: function update(changed, ctx) {
    			if ((changed.formattedData) && t0_value !== (t0_value = ctx.day)) {
    				set_data(t0, t0_value);
    			}

    			if (changed.formattedData || changed.Object) {
    				each_value_1 = ctx.formattedData[ctx.day];

    				for (var i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}
    				each_blocks.length = each_value_1.length;
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(h2);
    				detach(t1);
    			}

    			destroy_each(each_blocks, detaching);

    			if (detaching) {
    				detach(each_1_anchor);
    			}
    		}
    	};
    }

    function create_fragment$1(ctx) {
    	var if_block_anchor;

    	var if_block = (ctx.isDataFormatted) && create_if_block(ctx);

    	return {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert(target, if_block_anchor, anchor);
    		},

    		p: function update(changed, ctx) {
    			if (ctx.isDataFormatted) {
    				if (if_block) {
    					if_block.p(changed, ctx);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);

    			if (detaching) {
    				detach(if_block_anchor);
    			}
    		}
    	};
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { summary, days } = $$props;
      let formattedData;
      let isDataFormatted = false;

      onMount(() => {
        prepareSummary();
      });

      function prepareSummary() {
        $$invalidate('formattedData', formattedData = summary.reduce((acc, curr) => {
          if (Object.keys(acc).includes(curr.title)) {
            acc[curr.title] = [...acc[curr.title], curr];
          } else {
            acc[curr.title] = [curr];
          }
          return acc;
        }, {}));
        $$invalidate('isDataFormatted', isDataFormatted = true);
        console.log(formattedData);
      }

    	const writable_props = ['summary', 'days'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<TrainingWeekSummary> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ('summary' in $$props) $$invalidate('summary', summary = $$props.summary);
    		if ('days' in $$props) $$invalidate('days', days = $$props.days);
    	};

    	return {
    		summary,
    		days,
    		formattedData,
    		isDataFormatted,
    		Object
    	};
    }

    class TrainingWeekSummary extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, ["summary", "days"]);

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.summary === undefined && !('summary' in props)) {
    			console.warn("<TrainingWeekSummary> was created without expected prop 'summary'");
    		}
    		if (ctx.days === undefined && !('days' in props)) {
    			console.warn("<TrainingWeekSummary> was created without expected prop 'days'");
    		}
    	}

    	get summary() {
    		throw new Error("<TrainingWeekSummary>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set summary(value) {
    		throw new Error("<TrainingWeekSummary>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get days() {
    		throw new Error("<TrainingWeekSummary>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set days(value) {
    		throw new Error("<TrainingWeekSummary>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\TrainingDay.svelte generated by Svelte v3.4.4 */

    const file$2 = "src\\components\\TrainingDay.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.dayNumber = list[i];
    	child_ctx.i = i;
    	return child_ctx;
    }

    function get_each_context_1$1(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.day = list[i];
    	return child_ctx;
    }

    // (49:6) {#each nbOfDays as day (day.id)}
    function create_each_block_1$1(key_1, ctx) {
    	var option, t0_value = ctx.day.text, t0, t1, option_value_value;

    	return {
    		key: key_1,

    		first: null,

    		c: function create() {
    			option = element("option");
    			t0 = text(t0_value);
    			t1 = text(" per week");
    			option.__value = option_value_value = ctx.day;
    			option.value = option.__value;
    			add_location(option, file$2, 49, 8, 1246);
    			this.first = option;
    		},

    		m: function mount(target, anchor) {
    			insert(target, option, anchor);
    			append(option, t0);
    			append(option, t1);
    		},

    		p: function update(changed, ctx) {
    			option.value = option.__value;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(option);
    			}
    		}
    	};
    }

    // (57:0) {#if nbDaysTrainingPerWeek}
    function create_if_block_1$1(ctx) {
    	var div, t, button, current, dispose;

    	var each_value = ctx.nbDaysTrainingPerWeek.value;

    	var each_blocks = [];

    	for (var i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	function outro_block(i, detaching, local) {
    		if (each_blocks[i]) {
    			if (detaching) {
    				on_outro(() => {
    					each_blocks[i].d(detaching);
    					each_blocks[i] = null;
    				});
    			}

    			each_blocks[i].o(local);
    		}
    	}

    	return {
    		c: function create() {
    			div = element("div");

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    			button = element("button");
    			button.textContent = "generate summary";
    			div.className = "all-days svelte-gd9xlf";
    			add_location(div, file$2, 57, 2, 1415);
    			add_location(button, file$2, 64, 2, 1659);
    			dispose = listen(button, "click", ctx.generateSummary);
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			insert(target, t, anchor);
    			insert(target, button, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (changed.handleNewExercise || changed.nbDaysTrainingPerWeek) {
    				each_value = ctx.nbDaysTrainingPerWeek.value;

    				for (var i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    						each_blocks[i].i(1);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].i(1);
    						each_blocks[i].m(div, null);
    					}
    				}

    				group_outros();
    				for (; i < each_blocks.length; i += 1) outro_block(i, 1, 1);
    				check_outros();
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			for (var i = 0; i < each_value.length; i += 1) each_blocks[i].i();

    			current = true;
    		},

    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);
    			for (let i = 0; i < each_blocks.length; i += 1) outro_block(i, 0);

    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}

    			destroy_each(each_blocks, detaching);

    			if (detaching) {
    				detach(t);
    				detach(button);
    			}

    			dispose();
    		}
    	};
    }

    // (59:4) {#each nbDaysTrainingPerWeek.value as dayNumber, i}
    function create_each_block$2(ctx) {
    	var div, current;

    	var trainingdaydetails = new TrainingDayDetails({
    		props: { title: `day ${++ctx.i}` },
    		$$inline: true
    	});
    	trainingdaydetails.$on("add-exercise", ctx.handleNewExercise);

    	return {
    		c: function create() {
    			div = element("div");
    			trainingdaydetails.$$.fragment.c();
    			div.className = "training-day-details svelte-gd9xlf";
    			add_location(div, file$2, 59, 6, 1500);
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			mount_component(trainingdaydetails, div, null);
    			current = true;
    		},

    		p: noop,

    		i: function intro(local) {
    			if (current) return;
    			trainingdaydetails.$$.fragment.i(local);

    			current = true;
    		},

    		o: function outro(local) {
    			trainingdaydetails.$$.fragment.o(local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}

    			trainingdaydetails.$destroy();
    		}
    	};
    }

    // (67:0) {#if isSummaryReady}
    function create_if_block$1(ctx) {
    	var current;

    	var trainingweeksummary = new TrainingWeekSummary({
    		props: {
    		summary: ctx.summary,
    		days: ctx.nbDaysTrainingPerWeek.value.length
    	},
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			trainingweeksummary.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(trainingweeksummary, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var trainingweeksummary_changes = {};
    			if (changed.summary) trainingweeksummary_changes.summary = ctx.summary;
    			if (changed.nbDaysTrainingPerWeek) trainingweeksummary_changes.days = ctx.nbDaysTrainingPerWeek.value.length;
    			trainingweeksummary.$set(trainingweeksummary_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			trainingweeksummary.$$.fragment.i(local);

    			current = true;
    		},

    		o: function outro(local) {
    			trainingweeksummary.$$.fragment.o(local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			trainingweeksummary.$destroy(detaching);
    		}
    	};
    }

    function create_fragment$2(ctx) {
    	var div, form, select, each_blocks = [], each_1_lookup = new Map(), t0, t1_value = JSON.stringify(ctx.nbDaysTrainingPerWeek), t1, t2, t3, if_block1_anchor, current, dispose;

    	var each_value_1 = ctx.nbOfDays;

    	const get_key = ctx => ctx.day.id;

    	for (var i = 0; i < each_value_1.length; i += 1) {
    		let child_ctx = get_each_context_1$1(ctx, each_value_1, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block_1$1(key, child_ctx));
    	}

    	var if_block0 = (ctx.nbDaysTrainingPerWeek) && create_if_block_1$1(ctx);

    	var if_block1 = (ctx.isSummaryReady) && create_if_block$1(ctx);

    	return {
    		c: function create() {
    			div = element("div");
    			form = element("form");
    			select = element("select");

    			for (i = 0; i < each_blocks.length; i += 1) each_blocks[i].c();

    			t0 = space();
    			t1 = text(t1_value);
    			t2 = space();
    			if (if_block0) if_block0.c();
    			t3 = space();
    			if (if_block1) if_block1.c();
    			if_block1_anchor = empty();
    			if (ctx.nbDaysTrainingPerWeek === void 0) add_render_callback(() => ctx.select_change_handler.call(select));
    			add_location(select, file$2, 47, 4, 1155);
    			add_location(form, file$2, 46, 2, 1104);
    			add_location(div, file$2, 45, 0, 1096);

    			dispose = [
    				listen(select, "change", ctx.select_change_handler),
    				listen(form, "submit", prevent_default(handleSubmit))
    			];
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			append(div, form);
    			append(form, select);

    			for (i = 0; i < each_blocks.length; i += 1) each_blocks[i].m(select, null);

    			select_option(select, ctx.nbDaysTrainingPerWeek);

    			append(div, t0);
    			append(div, t1);
    			insert(target, t2, anchor);
    			if (if_block0) if_block0.m(target, anchor);
    			insert(target, t3, anchor);
    			if (if_block1) if_block1.m(target, anchor);
    			insert(target, if_block1_anchor, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			const each_value_1 = ctx.nbOfDays;
    			each_blocks = update_keyed_each(each_blocks, changed, get_key, 1, ctx, each_value_1, each_1_lookup, select, destroy_block, create_each_block_1$1, null, get_each_context_1$1);

    			if (changed.nbDaysTrainingPerWeek) select_option(select, ctx.nbDaysTrainingPerWeek);

    			if ((!current || changed.nbDaysTrainingPerWeek) && t1_value !== (t1_value = JSON.stringify(ctx.nbDaysTrainingPerWeek))) {
    				set_data(t1, t1_value);
    			}

    			if (ctx.nbDaysTrainingPerWeek) {
    				if (if_block0) {
    					if_block0.p(changed, ctx);
    					if_block0.i(1);
    				} else {
    					if_block0 = create_if_block_1$1(ctx);
    					if_block0.c();
    					if_block0.i(1);
    					if_block0.m(t3.parentNode, t3);
    				}
    			} else if (if_block0) {
    				group_outros();
    				on_outro(() => {
    					if_block0.d(1);
    					if_block0 = null;
    				});

    				if_block0.o(1);
    				check_outros();
    			}

    			if (ctx.isSummaryReady) {
    				if (if_block1) {
    					if_block1.p(changed, ctx);
    					if_block1.i(1);
    				} else {
    					if_block1 = create_if_block$1(ctx);
    					if_block1.c();
    					if_block1.i(1);
    					if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
    				}
    			} else if (if_block1) {
    				group_outros();
    				on_outro(() => {
    					if_block1.d(1);
    					if_block1 = null;
    				});

    				if_block1.o(1);
    				check_outros();
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			if (if_block0) if_block0.i();
    			if (if_block1) if_block1.i();
    			current = true;
    		},

    		o: function outro(local) {
    			if (if_block0) if_block0.o();
    			if (if_block1) if_block1.o();
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}

    			for (i = 0; i < each_blocks.length; i += 1) each_blocks[i].d();

    			if (detaching) {
    				detach(t2);
    			}

    			if (if_block0) if_block0.d(detaching);

    			if (detaching) {
    				detach(t3);
    			}

    			if (if_block1) if_block1.d(detaching);

    			if (detaching) {
    				detach(if_block1_anchor);
    			}

    			run_all(dispose);
    		}
    	};
    }

    function handleSubmit(event) {
      console.log("handleSubmit");
    }

    function instance$2($$self, $$props, $$invalidate) {
    	

      const nbOfDays = [
        { id: 1, text: "One day", value: [1] },
        { id: 2, text: "Two days", value: [1, 2] },
        { id: 3, text: "Three days", value: [1, 2, 3] },
        { id: 4, text: "Four days", value: [1, 2, 3, 4] },
        { id: 5, text: "Five days", value: [1, 2, 3, 4, 5] },
        { id: 6, text: "Six days", value: [1, 2, 3, 4, 5, 6] },
        { id: 7, text: "Seven days", value: [1, 2, 3, 4, 5, 6, 7] }
      ];

      let nbDaysTrainingPerWeek;

      let summary = [];
      let isSummaryReady = false;

      function handleNewExercise(event) {
        console.log("on:add-exercise", event.detail);
        $$invalidate('summary', summary = [...summary, event.detail]);
        $$invalidate('isSummaryReady', isSummaryReady = false);
      }

      function generateSummary() {
        $$invalidate('isSummaryReady', isSummaryReady = true);
      }

    	function select_change_handler() {
    		nbDaysTrainingPerWeek = select_value(this);
    		$$invalidate('nbDaysTrainingPerWeek', nbDaysTrainingPerWeek);
    		$$invalidate('nbOfDays', nbOfDays);
    	}

    	return {
    		nbOfDays,
    		nbDaysTrainingPerWeek,
    		summary,
    		isSummaryReady,
    		handleNewExercise,
    		generateSummary,
    		select_change_handler
    	};
    }

    class TrainingDay extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, []);
    	}
    }

    /* src\App.svelte generated by Svelte v3.4.4 */

    const file$3 = "src\\App.svelte";

    function create_fragment$3(ctx) {
    	var h1, t0, t1, current;

    	var trainingday = new TrainingDay({ $$inline: true });

    	return {
    		c: function create() {
    			h1 = element("h1");
    			t0 = text(ctx.name);
    			t1 = space();
    			trainingday.$$.fragment.c();
    			h1.className = "svelte-1ucbz36";
    			add_location(h1, file$3, 11, 0, 148);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, h1, anchor);
    			append(h1, t0);
    			insert(target, t1, anchor);
    			mount_component(trainingday, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (!current || changed.name) {
    				set_data(t0, ctx.name);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			trainingday.$$.fragment.i(local);

    			current = true;
    		},

    		o: function outro(local) {
    			trainingday.$$.fragment.o(local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(h1);
    				detach(t1);
    			}

    			trainingday.$destroy(detaching);
    		}
    	};
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { name } = $$props;

    	const writable_props = ['name'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ('name' in $$props) $$invalidate('name', name = $$props.name);
    	};

    	return { name };
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, ["name"]);

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.name === undefined && !('name' in props)) {
    			console.warn("<App> was created without expected prop 'name'");
    		}
    	}

    	get name() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'Weekly workout'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
