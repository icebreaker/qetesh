var Qetesh = (function()
{
  var VERSION = '0.1';
  var glyphs, saves, canvas, r, font, selected, action;

  function ListBox(id, className)
  {
    this.initialize.apply(this, arguments);
  }
  ListBox.prototype = 
  {
    selected: null,
    initialize: function(id, className)
    {
      this.id = id;
      this.el = document.getElementById(id);
      this.className = className;
    },
    add: function(item)
    {
      var self = this;
      var a = document.createElement('a');
      a.className = self.className;
      a.innerHTML = item;
      a.href = 'javascript:void(0);';
      a.onclick = function()
      {
        if(self.selected)
          self.selected.classList.toggle('selected');
 
        self.selected = self.onselect(this);

        if(self.selected)
          self.selected.classList.toggle('selected');
      };
      a.oncontextmenu = function()
      {
        self.ondeselect(self.selected, this);

        if(self.selected)
        {
          self.selected.classList.toggle('selected');
          self.selected = null;
        }

        return false;
      };
      return this.el.appendChild(a);
    },
    remove: function(item)
    {
      var items = this.el.childNodes;
      for(var i=0; i<items.length; i++)
      {
        if(items[i].innerHTML == item)
          return this.el.removeChild(items[i]);
      }
      return null;
    },
    clear: function()
    {
      this.el.innerHTML = '';
    },
    first: function()
    {
      return this.el.childNodes[0];
    },
    toggle: function()
    {
      this.el.parentNode.classList.toggle('hidden');
    },
    show: function()
    {
      this.el.parentNode.classList.remove('hidden');
    },
    hide: function()
    {
      this.el.parentNode.classList.add('hidden'); 
    },
    onselect: function(item)
    {
      return item; 
    },
    ondeselect: function(item, active)
    {
      return item;       
    },
  };

  function init()
  {
    glyphs = new ListBox('glyphs-container', 'glyph');
    for(var i=33; i<127; i++)
    {
      if(i == 34)
        continue;

      glyphs.add(String.fromCharCode(i));
    }

    saves = new ListBox('saves-container', 'save');
    saves.add('&lt;save new&gt;').classList.add('hidden');

    var _saves = store.get('saves') || {};
    for(var s in _saves)
      saves.add(s);

    saves.onselect = function(item)
    {
      switch(action.id)
      {
        case "save":
        {
          if(item == saves.first())
            name = prompt('Enter a name:', 'Untitled');
          else if(confirm('Are you sure that you want to overwrite?'))
            name = item.innerHTML;

          if(name != null && name != '')
          {
            _saves[name] = r.toJSON();
            store.set('saves', _saves);

            if(item == saves.first())
              this.add(name);
          }
        }
        break;

        case "load":
        {
          r.clear();
          r.fromJSON(_saves[item.innerHTML], bind);
        }
        break;
      }
      action.click();
      
      return null;
    }
    saves.ondeselect = function(item, active)
    {
      if(confirm('Are you sure that you want to delete?'))
      {
        var name = active.innerHTML;
        delete _saves[name];
        store.set('saves', _saves);
        this.remove(name);
      }
      return item;
    }

    function bind(glyph)
    {
      glyph.attr({cursor: "move"}).drag(
        function(dx, dy) // move
        {
          this.translate(dx - this.dx, dy - this.dy);
          this.dx = dx;
          this.dy = dy;
        },
        function() // start
        {
          selected = this;
          this.dx = 0;
          this.dy = 0;
          this.toFront();
        },
        function() // end
        {
          // empty
        }
      );
      glyph.node.oncontextmenu = function()
      {
        glyph.remove();
        return false;
      }
      return glyph;
    }

    canvas = document.getElementById('canvas');
    canvas.onmouseup = function(e)
    {
      if(selected || glyphs.selected == null)
      {
        selected = null;
        return;
      }

      var x = (e.offsetX || e.offsetX == 0) || (e.layerX || e.layerX == 0);
      var y = (e.offsetY || e.offsetY == 0) || (e.layerY || e.layerY == 0);

      var glyph = bind(r.print(x, y, glyphs.selected.innerHTML, font, 64));

      glyphs.selected.classList.toggle('selected');
      glyphs.selected = null;
    }
    canvas.oncontexmenu = function()
    {
      return false;
    }

    r = Raphael(canvas, window.innerWidth, window.innerHeight);
    font = r.getFont('Hieroglyphs');

    canvas.childNodes[0].oncontextmenu = function() { return false;  }

    document.getElementById('glyphs').onclick = function()
    {
      glyphs.toggle();
      this.classList.toggle('selected');
    }
    document.getElementById('load').onclick = function()
    {
      if(action && action != this)
        action.classList.remove('selected');

      action = this;

      saves.first().classList.add('hidden');

      if(action.classList.contains('selected'))
      {
        action.classList.remove('selected');
        saves.hide();
      }
      else
      {
        action.classList.add('selected');
        saves.show();
      }
    }
    document.getElementById('save').onclick = function()
    {
      if(action && action != this)
        action.classList.remove('selected');

      action = this;

      saves.first().classList.remove('hidden');

      if(action.classList.contains('selected'))
      {
        action.classList.remove('selected');
        saves.hide();
      }
      else
      {
        action.classList.add('selected');
        saves.show();
      }
    }
    document.getElementById('clear').onclick = function() { r.clear(); };
    document.getElementById('export').onclick = function()
    {
      var doc = window.open('about:blank').document;
      var svg = r.toSVG();
      doc.write(svg);
      doc.write('<textarea cols=80 rows=20>' + svg + '</textarea>');
    };
  }

  return { init: init, version: VERSION };
})();
