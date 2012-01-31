var $gistex, Gistex = function() {

  var self, C = {

    options : {
      showOnReady : true,
      className : 'gist-stage',
      timeout : 10000
    },

    initialize : function(container,src,options) {
      if(typeof src == 'object') {
        src = self.prepareSrc(src.file,src.id);
      }
      else {
        var matches = src.match(/<script.+?src=['"](https?:\/\/gist.github.com\/.+?)['"].+?><\/script>/g);
        if(matches && matches.length > 0) {
          src = matches[1];
        }
      }

      self.container = typeof container == 'string' ? document.getElementById(container) : container;
      self.src = src;
      self.mergeOptions(options);
    },

    mergeOptions : function(options) {
      if(!self.options) {
        self.options = {};
      }
      options = options || {};
      for(var key in options) {
        var value = options[key];
        self.options[key]=value;
      }
    },

    resetVariables : function() {
      self.loaded = false;
      self.cancelled = false;
      self.timedOut = false;
      var id = self.getID();
      Gistex.callbacks[id] = null;
      Gistex.buffers[id] = null;
    },

    load : function() {
      if(this.options.showOnReady) {
        self.hide();
      }
      self.resetVariables();
      self.onLoading();
      self.injectIFrameHTML();
      self.startTimer();
    },

    getContainer : function() {
      return self.container;
    },

    getIFrameDocument : function() {
      iframe = self.getIFrame();
      return iframe.contentDocument || iframe.contentWindow.document;
    },

    prepareSrc : function(file,id) {
      return 'https://gist.github.com/' + id + '.js?file=' + file
    },

    getSrc : function() {
      return self.src;
    },

    getID : function() {
      if(!self.id) {
        self.id = 'gist-' + new Date().getTime();
      }
      return self.id;
    },

    getInnerID : function() {
      return self.getID() + '-inner';
    },

    getInnerHTML : function() {
      return self.innerElementHTML;
    },

    getIFrame : function() {
      if(!self.iframe) {
        var iframe = document.createElement('iframe');
        iframe.id = this.getID();
        iframe.style.width = 0;
        iframe.style.height = 0;
        iframe.style.border = 0;
        iframe.frameborder = 0;
        iframe.scrolling = 'no';
        self.getContainer().appendChild(iframe);
        self.iframe = iframe;
      }
      return self.iframe;
    },

    injectIFrameHTML : function() {
      var iframe = self.getIFrame();
      var id = self.getID();
      var that = self;

      Gistex.callbacks[id] = function(id) {
        that.onIFrameLoaded.apply(that,[id]);
      };

      Gistex.buffers[id] = function(content) {
        if(!self.innerElementHTML) {
          that.innerElementHTML = '';
        }
        that.innerElementHTML += content;
      };

      var doc = this.getIFrameDocument();
      var html = '<html>'+
                 '<head>'+
                 '<script type="text/javascript">' + 
                 ' document.write = function(content) {'+
                 '   window.parent.Gistex.buffers["'+id+'"](content);'+
                 ' };' +
                 '</script>' +
                 '</head>' +
                 '<body onload="window.parent.Gistex.callbacks[\'' + id + '\'](\'' + id + '\');">' +
                 '<div id="'+self.getInnerID()+'">' +
                 '<script type="text/javascript" src="'+self.getSrc()+'"></script>' + 
                 '</div>' +
                 '</body>' +
                 '</html>';

      doc.open('text/html',false);
      doc.write(html);
      doc.close();
    },

    onIFrameLoaded : function(id) {
      if(!self.timedOut && !self.cancelled) {

        self.loaded = true;
        self.endTimer();

        var iframe = document.getElementById(id);
        var container = self.getContainer();
        var doc = self.getIFrameDocument();
        var html = this.getInnerHTML().replace(/^\s+|\s+$/g,"");

        container.innerHTML = '';

        if(html.length > 0) {
          //setup the stylesheet
          var ss = html.match(/<link.+?href=['"](.+?github.com.+?)['"]\/?>/);
          html = html.replace(ss[0],'');
          self.applyStyleSheet(ss[1]);

          var elm = document.createElement('div');
          elm.className = self.options.className;
          elm.innerHTML = html;
          container.appendChild(elm);

          self.onComplete();
          self.onReady();
        }
        else {
          self.onComplete();
          self.onFailure();
        }

        this.resetVariables();
      }
    },

    applyStyleSheet : function(src) {

      var head =document.getElementsByTagName('head')[0];
      var sheets = head.getElementsByTagName('link');
      var found = false;
      for(var i=0;i<sheets.length;i++) {
        if(sheets[i]=src==src){
          break;
        }
      }	

      if(!found) {
        var sheet = document.createElement('link');
        sheet.rel = 'stylesheet';
        sheet.type = 'text/css';
        sheet.href = src;
        head.appendChild(sheet);
      }
    },

    show : function() {
      self.getContainer().style.display = 'block';
    },

    hide : function() {
      self.getContainer().style.display = 'none';
    },

    startTimer : function() {
      var fn = function() {
        self.onTimeout.apply(self);
      }
      self.timer = setTimeout(fn,self.options.timeout);
    },

    endTimer : function() {
      if(self.timer) {
        clearTimeout(self.timer);
      }
      self.timer = null;
    },

    cancel : function() {
      if(!self.loaded) {
        self.cancelled = true;
        self.endTimer();
        self.onCancel();
      }
    },

    onComplete : function() {
      self.fire('complete');
    },

    onCancel : function() {
      self.fire('cancel');
    },

    onFailure : function() {
      self.fire('failure');
    },

    onTimeout : function() {
      self.fire('timeout');
    },

    onLoading : function() {
      self.fire('loading');
    },

    onReady : function() {
      if(this.options.showOnReady) {
        this.show();
      }
      self.fire('ready');
    },

    fire : function(method) {
      method = 'on' + method.charAt(0).toUpperCase() + method.substr(1);
      var fn = self.options[method];
      if(fn) {
        fn();
      }
    }
  };

  self = C;

  C.initialize.apply(this,arguments);

  return C;

};

$gistex = function(container,url,onReady) {
  var gs = new Gistex(container,url,{
    onReady : onReady
  });
  gs.load();
  return gs;
}

Gistex.buffers = {};
Gistex.callbacks = {};
