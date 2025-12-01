import SystemSetting from '../models/SystemSetting.js';

/**
 * API 3.1: Tự động gia hạn
 * PUT /api/admin/settings/auto-extend
 */

export const updateAutoExtendSettings = async (req, res) => {
  try {
    const { autoExtendEnabled, autoExtendThreshold, autoExtendDuration } =
      req.body;
    const adminId = req.user_id;

    console.log("[ADMIN CONTROLLER] Cập nhật cấu hình tự động gia hạn:", {
      autoExtendEnabled,
      autoExtendThreshold,
      autoExtendDuration,
    });

    // Validate
    if (typeof autoExtendEnabled !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "autoExtendEnabled phải là boolean",
      });
    }

    if (
      autoExtendThreshold &&
      (autoExtendThreshold < 1 || autoExtendThreshold > 30)
    ) {
      return res.status(400).json({
        success: false,
        message: "Thời gian ngưỡng phải từ 1 - 30 phút",
      });
    }

    if (
      autoExtendDuration &&
      (autoExtendDuration < 1 || autoExtendDuration > 60)
    ) {
      return res.status(400).json({
        success: false,
        message: "Thời gian gia hạn phải từ 1 - 60 phút",
      });
    }

    // Cập nhật cấu hình tự động gia hạn
    const updates = [];

    if (autoExtendEnabled !== undefined) {
      updates.push(
        SystemSetting.updateSetting(
          "autoExtendedEnabled",
          autoExtendEnabled,
          adminId
        )
      );
    }

    if (autoExtendDuration) {
      updates.push(
        SystemSetting.updateSettings(
          "autoExtendedThreshold",
          autoExtendThreshold,
          adminId
        )
      );
    }

    if (autoExtendDuration) {
      updates.push(
        SystemSetting.updateSettings(
          "autoExtendedDuration",
          autoExtendDuration,
          adminId
        )
      );
    }

    await Promise.all(updates);

    return res.status(200).json({
      success: true,
      message: "Cập nhật cấu hình tự gia hạn thành công",
      data: {
        autoExtendEnabled,
        autoExtendThreshold,
        autoExtendDuration,
      },
    });
  } catch (error) {
    console.error("[ADMIN CONTROLLER] Error:", errror);
    return res.status(500).json({
      success: false,
      message: "Lỗi server",
      errror: error.message,
    });
  }
};

/**
 * API: Lấy cấu hình hiện tại
 * GET /api/admin/settings/auto-extend
 */

export const getAutoExtendSettings = async (req, res) => {
  try {
    const autoExtendedEnabled = await SystemSetting.getSettings(
      "autoExtendedEnabled",
      true
    );
    const autoExtendedThreshold = await SystemSetting.getSettings(
      "autoExtendedThreshold",
      5
    );
    const autoExtendDuration = await SystemSetting.getSettings(
      "autoExtendedDuration",
      10
    );

    return res.status(200).json({
      success: true,
      data: {
        autoExtendedEnabled,
        autoExtendedThreshold,
        autoExtendDuration,
      },
    });
  } catch (error) {
    console.errror("[ADMIN CONTROLLER] Error", errror);
    return res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: error.message,
    });
  }
};
