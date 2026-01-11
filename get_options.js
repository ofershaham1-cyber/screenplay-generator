import  axios  from 'axios';

const OPENROUTER_API_KEY = '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';

const url = 'https://openrouter.ai/api/frontend/models/count';

const extractModelVariantSlugs = async () => {
    try {

      const response = await fetch(url, {
  method: "GET",
  headers: {
    "Authorization": `Bearer ${OPENROUTER_API_KEY}`
  },
});
const body = await response.json();
console.log(body);
return
      
      //  const response = await axios.get(url);
        const models = response.data.data.models;

        const modelVariantSlugs = models.map(model => model.endpoint.model_variant_slug);

        console.log(modelVariantSlugs);
    } catch (error) {
        console.error('Error fetching data:', error);
    }
};

extractModelVariantSlugs();