import Country from "../models/Country.js";

export const listCountries = async (req, res) => {
  try {
    const countries = await Country.find({}, "name slug region active").sort({ name: 1 }).lean();
    res.json(countries);
  } catch (error) {
    console.error("listCountries error:", error && error.message ? error.message : error);
    res.status(500).json({ message: error.message || "Failed to list countries" });
  }
};

export default { listCountries };
