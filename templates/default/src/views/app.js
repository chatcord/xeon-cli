import Xeon from "/xeon";
// import Style from "./app.css";

// Extend the Pre-built Xeon class. You Will Get Some Extra Functions Fron Xeon.
export default class extends Xeon {
      constructor(params){
            super(params);
            // Set the title and favicon for this route. It is optional.
            this.setTitle("{%name%}");
            this.setIcon("/assets/logo/logo192.png");
      }
      async getHtml(){
            // return the html value. you can use ${<variables>} like that.
            return(`
                  <css src="/src/views/app.css" />
                  <div class="container">
                        <h2 class="greet">Congrats For Creating Your First Project On Xeon JS.</h2>
                        <div class="logo"><img src="/assets/logo/logo.svg" /></div>
                        <h2 class="greet">App name : '{%name%}'</h2>
                        <p>Now Go To "./src/view/app.js" and change the content and refresh the page to view changes.</p>
                  </div>
            `);
      }
}