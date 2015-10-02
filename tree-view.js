
/* ==========================================================================
 * Treeview component
 * ========================================================================== */

;(function ($, F, window, document, undefined){
  "use strict";

  /**
   * Returns the jQuery object for the given `obj`.
   * `obj` can be any type that jQuery understands.
   * if `obj` is a jQuery object, it is returned.
   *
   * @param {*} obj
   * @returns {*}
   */
  var $Obj  = function(obj){
      return obj ? (obj.jQuery ? obj : $(obj)) : $();
    };

  /**
   * Create our component as an extension of the app
   *
   * @type {treeView}
   */
  window.treeView = new function(){
    var lib = this; // component scope

    this.namespace  = 'tree-view';  // component namespace


    /**
     * Returns the tree view root container
     * for the given element
     *
     * @param {*} elm
     * @returns {*}
     */
    var getContainer    = function(elm){
      return $Obj(elm).closest('[data-' + lib.namespace + ']');
    };

    /**
     * returns a list of child inputs for the given parent input
     *
     * @param {*} input
     * @returns {*}
     */
    var getChildren     = function(input){
      return $Obj(input)
        .closest('li')
        .children('ul')
        .find('> li > label :checkbox, > li > label :radio');
    };

    /**
     * Updates the children for the given parent input
     * By default, it also triggers the change event to update
     * their children too
     *
     * @param {*} input
     * @param {boolean=} recurse defaults to `true`
     */
    var updateChildren  = function(input, recurse){
      var $inp      = $Obj(input),
          $children = getChildren($inp), // 1st level children of the input
          isChecked = $inp.prop('checked');

      recurse = recurse !== false;

      if($children.length){
        // change their checked state to match the parent
        $children.prop('checked', isChecked).prop('indeterminate', false);

        // if we have a radio that is checked, we need to ensure other radios,
        // in the same group, have their children correctly unchecked
        if(isChecked && $inp.is(':radio')){
          // go up to the tree view root
          getContainer($inp)
            // find all radios with the same name
            .find(':radio[name="' + $inp.attr('name') + '"]')
            // except for the current one
            .not($inp)
            .prop('checked', false)
            .prop('indeterminate', false)
            // loop through and update their children
            .each(function(i, elm){
              updateChildren(elm, recurse);
            });
        }

        if(recurse){
          // recurse the update down the tree, to the children
          $children.each(function(i, elm){
            updateChildren(elm, recurse);
          });
        }
      }
    };


    /**
     * returns a the parent input for the given input
     *
     * @param {*} input
     * @returns {*}
     */
    var getParent       = function(input){
      var $inp  = $Obj(input);

      return $inp
        // get the closest UL within the root tree
        .closest('ul', getContainer($inp).get(0))
        // find the parent label
        .siblings('label')
        // find any checkbox or radio inside the label
        .find(':checkbox, :radio')
    };

    /**
     * Updates the parent input for the given input
     *
     * @param {*} input
     * @param {boolean=} recurse defaults to `true`
     */
    var updateParent    = function(input, recurse){
      var $inp            = $Obj(input),          // given input
          $childHolder    = $inp.closest('ul'),   // holder for the input and it's siblings
          $parent         = getParent($inp),      // parent input
          isChecked       = $inp.prop('checked'), // flag - whether the input is checked or not
          isIndeterminate = false;                // flag - whether the parent state is indeterminate or not

      if(!$parent.length){
        // no parent found - stop handling
        return;
      }

      // check the indeterminate state of the parent
      if(
        // input is checked and unchecked siblings exist OR input is unchecked and checked siblings exist
      $childHolder.find('input[type="checkbox"]' + (isChecked ? ':not(:checked)' : ':checked')).length  ||
        // parent has indeterminate children
      $childHolder.find('input[type="checkbox"]:indeterminate').length
      ){
        isIndeterminate = true;
      }


      if(isIndeterminate){
        // parent is indeterminate
        $parent.prop('indeterminate', true);
      }else{
        $parent
          .prop('checked', isChecked)
          .prop('indeterminate', false);
      }

      if(recurse !== false){
        // recurse into the parent's parent
        updateParent($parent);
      }
    };


    /**
     * Initialises the component.
     * This can be called when new elements are added to the page
     */
    this.init           = function(){
      /**
       * Ensure that only open branches are shown
       */
      $('[data-' + this.namespace + '] li:not(' + lib.namespace + '-open)').addClass(lib.namespace + '-closed');

      /**
       * Add handles to all branches that have children
       */
      $('[data-' + this.namespace + '] li:has(> ul)')
        // filter out any branches that already have a handle
        .not(':has(> [data-' + lib.namespace + '-handle])')
        // add a handle
        .prepend('<span data-' + lib.namespace + '-handle>&gt;</span>');
    };


    /**
     * Open and close trees when clicking on a handle
     */
    $(document).on('click.' + this.namespace, '[data-' + this.namespace + '] [data-' + this.namespace + '-handle]', function(e){
      var $handle     = $Obj(this),
          $container  = $handle.closest('li');

      e.preventDefault();

      if($container.hasClass(lib.namespace + '-open')){
        $container.removeClass(lib.namespace + '-open').addClass(lib.namespace + '-closed');
      }else{
        $container.removeClass(lib.namespace + '-closed').addClass(lib.namespace + '-open');
      }
    });

    /**
     * Handle checkbox state changes
     */
    $(document).on('change.' + this.namespace, '[data-' + this.namespace + '] :checkbox, [data-' + this.namespace + '] :radio', function(){
      var $inp    = $(this),
          checked = $inp.prop('checked');

      // update the child input states and trigger them recursively
      updateChildren($inp);

      // update the parent input states
      updateParent($inp);
    });


    // initialise the component
    this.init();
  };
}(jQuery, window, window.document));
