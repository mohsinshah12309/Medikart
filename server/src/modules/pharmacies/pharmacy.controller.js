const pharmacyService = require("./pharmacy.service");

const getPharmacies = async (req, res, next) => {
  try {
    const { active } = req.query;
    const pharmacies = await pharmacyService.getPharmacies({
      active: active !== undefined ? active === "true" : undefined,
    });
    res.status(200).json({
      status: "success",
      results: pharmacies.length,
      data: { pharmacies },
    });
  } catch (error) {
    next(error);
  }
};

const getPharmacyById = async (req, res, next) => {
  try {
    const pharmacy = await pharmacyService.getPharmacyById(req.params.id);
    res.status(200).json({
      status: "success",
      data: { pharmacy },
    });
  } catch (error) {
    next(error);
  }
};

const createPharmacy = async (req, res, next) => {
  try {
    const pharmacy = await pharmacyService.createPharmacy(req.body);
    res.status(201).json({
      status: "success",
      data: { pharmacy },
    });
  } catch (error) {
    next(error);
  }
};

const updatePharmacy = async (req, res, next) => {
  try {
    const pharmacy = await pharmacyService.updatePharmacy(req.params.id, req.body);
    res.status(200).json({
      status: "success",
      data: { pharmacy },
    });
  } catch (error) {
    next(error);
  }
};

const deletePharmacy = async (req, res, next) => {
  try {
    await pharmacyService.deletePharmacy(req.params.id);
    res.status(200).json({
      status: "success",
      message: "Pharmacy deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

const getPharmacyReports = async (req, res, next) => {
  try {
    const { pharmacyId, startDate, endDate } = req.query;
    const reportData = await pharmacyService.getPharmacyReports({
      pharmacyId,
      startDate,
      endDate,
    });
    res.status(200).json({
      status: "success",
      data: reportData,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPharmacies,
  getPharmacyById,
  createPharmacy,
  updatePharmacy,
  deletePharmacy,
  getPharmacyReports,
};
