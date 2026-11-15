export const freeShippingThreshold = 14500;

export const priceRange = {
  min: 8000,
  max: 30000,
  step: 500,
};

export const storeAddress = "Subhash Chowk, Sikar";
export const storeEmail = "princeshahid@gmail.com";
export const whatsappUrl = "https://wa.me/919119324328";
const mapQuery = encodeURIComponent(storeAddress + ", Rajasthan, India");
export const mapsUrl = "https://www.google.com/maps/search/?api=1&query=" + mapQuery;
export const mapEmbedUrl = "https://maps.google.com/maps?output=embed&q=" + mapQuery;
