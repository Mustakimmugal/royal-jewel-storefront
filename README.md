# Royal Jewel — React storefront

A premium, responsive, static jewellery storefront built with React, Vite, Tailwind CSS v4, React Router, Framer Motion, React Icons, and Swiper.

## Run locally on Windows

1. Open Command Prompt (CMD).
2. Change to this project folder:

   ~~~cmd
   cd /d "C:\Users\Mustakim\Documents\Codex\2026-10-04\hi-x20\outputs\royal-jewel-storefront"
   ~~~

3. Install the listed frontend packages:

   ~~~cmd
   npm install
   ~~~

4. Start the preview:

   ~~~cmd
   npm run dev
   ~~~

5. Open the local address Vite prints in the terminal, usually http://localhost:5173.

For a production bundle, run npm run build. Vite writes the static deployable files to dist/. The included public/_redirects file enables React Router deep links on hosts that support Netlify-style redirects.

## Pages

- Home, Shop, static Product Details, Cart, Wishlist, About Us, Contact, Gallery, FAQ, Privacy Policy, and Terms & Conditions
- Search, category and price filters, and sort controls on the Shop page
- Responsive navigation, image galleries, customer quote slider, featured product slider, and Instagram-style gallery
- Cart quantity, removal, subtotal, and wishlist save/remove work in the browser and persist in local storage
- Checkout, newsletter, and contact forms are demos; they do not create orders or transmit form submissions

## Project structure

~~~text
src/
  assets/       asset notes
  components/   reusable navigation, cards, sections, and animation
  data/         local static product, category, testimonial, and gallery data
  hooks/        page metadata and demo toast context
  layouts/      shared page shell
  pages/        individual routes
  App.jsx
  index.css
  main.jsx
~~~

## Customize

- Edit product content and image URLs in src/data/products.js.
- Update brand copy, colors, and responsive styles in src/index.css.
- Change navigation/footer links in src/components/.
- Replace the sample contact details, policy text, prices, and delivery terms before publishing a real shop.

## Image sources

Jewellery and editorial photos are remote Pexels placeholders. Google Fonts are also loaded remotely. Keep an internet connection for those visuals, and replace assets with properly licensed store photography before a commercial launch.

- https://www.pexels.com/photo/model-posing-in-necklace-19647000/
- https://www.pexels.com/photo/elegant-gold-necklace-on-display-in-jewelry-store-29013500/
- https://www.pexels.com/photo/elegant-gold-jhumka-earring-on-woman-s-ear-37601639/
- https://www.pexels.com/photo/golden-ring-on-white-background-10581426/
- https://www.pexels.com/photo/photo-of-a-gold-bracelet-12124621/
- https://www.pexels.com/photo/close-up-shot-of-gold-earrings-12194363/
- https://www.pexels.com/photo/gold-necklace-with-a-pendant-12217206/
- https://www.pexels.com/photo/display-of-jewelry-20858959/

