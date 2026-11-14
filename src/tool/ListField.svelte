<script lang="ts">
  /*
   * A text box for one of a language's lists in its short written form: "p t*14 ng^0".
   * While you type, what you typed stays as you typed it; the tidy form comes back when you
   * leave the box, or when the language changes from somewhere else (a preset, a file).
   */
  let {
    label,
    value,
    onchange,
    help = '',
    placeholder = '',
    id,
  }: {
    label: string;
    /** The list as the language has it now, in its short form. */
    value: string;
    onchange: (text: string) => void;
    help?: string;
    placeholder?: string;
    id: string;
  } = $props();

  let focused = $state(false);
  let draft = $state('');
  const shown = $derived(focused ? draft : value);
</script>

<label class="eu-field">
  <span class="eu-label">{label}</span>
  <input
    class="eu-input eu-input--data"
    {id}
    value={shown}
    {placeholder}
    autocomplete="off"
    autocapitalize="off"
    spellcheck="false"
    maxlength="1200"
    aria-describedby={help ? `${id}-help` : undefined}
    onfocus={() => {
      draft = value;
      focused = true;
    }}
    oninput={(e) => {
      draft = e.currentTarget.value;
      onchange(draft);
    }}
    onblur={() => (focused = false)}
  />
  {#if help}<span class="eu-help" id="{id}-help">{help}</span>{/if}
</label>
