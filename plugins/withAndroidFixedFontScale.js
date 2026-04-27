const { withMainActivity, withMainApplication } = require('expo/config-plugins');

const ATTACH_BASE_CONTEXT_METHOD = `  override fun attachBaseContext(newBase: Context?) {
    val baseContext = newBase ?: return super.attachBaseContext(null)
    val configuration = Configuration(baseContext.resources.configuration)
    configuration.fontScale = 1.0f
    val adjustedContext = baseContext.createConfigurationContext(configuration)
    super.attachBaseContext(adjustedContext)
  }

  override fun applyOverrideConfiguration(overrideConfiguration: Configuration?) {
    if (overrideConfiguration != null) {
      overrideConfiguration.fontScale = 1.0f
    }
    super.applyOverrideConfiguration(overrideConfiguration)
  }

`;

const APP_ATTACH_BASE_CONTEXT_METHOD = `  override fun attachBaseContext(base: Context?) {
    val baseContext = base ?: return super.attachBaseContext(null)
    val configuration = Configuration(baseContext.resources.configuration)
    configuration.fontScale = 1.0f
    val adjustedContext = baseContext.createConfigurationContext(configuration)
    super.attachBaseContext(adjustedContext)
  }

`;

function withAndroidFixedFontScale(config) {
  config = withMainActivity(config, (config) => {
    if (config.modResults.language !== 'kt') {
      return config;
    }

    let contents = config.modResults.contents;

    if (!contents.includes('import android.content.Context')) {
      contents = contents.replace(
        'import android.os.Build',
        'import android.content.Context\nimport android.content.res.Configuration\nimport android.os.Build'
      );
    }

    if (!contents.includes('override fun attachBaseContext(newBase: Context?)')) {
      contents = contents.replace(
        'class MainActivity : ReactActivity() {\n',
        `class MainActivity : ReactActivity() {\n${ATTACH_BASE_CONTEXT_METHOD}`
      );
    }

    config.modResults.contents = contents;
    return config;
  });

  return withMainApplication(config, (config) => {
    if (config.modResults.language !== 'kt') {
      return config;
    }

    let contents = config.modResults.contents;

    if (!contents.includes('import android.content.Context')) {
      contents = contents.replace(
        'import android.app.Application',
        'import android.app.Application\nimport android.content.Context'
      );
    }

    if (!contents.includes('override fun attachBaseContext(base: Context?)')) {
      contents = contents.replace(
        'class MainApplication : Application(), ReactApplication {\n\n',
        `class MainApplication : Application(), ReactApplication {\n\n${APP_ATTACH_BASE_CONTEXT_METHOD}`
      );
    }

    if (!contents.includes('private fun resetFontScale(')) {
      contents = contents.replace(
        'class MainApplication : Application(), ReactApplication {\n\n',
        `class MainApplication : Application(), ReactApplication {\n\n  private fun resetFontScale(configuration: Configuration? = null) {\n    val config = Configuration(configuration ?: resources.configuration)\n    if (config.fontScale != 1.0f) {\n      config.fontScale = 1.0f\n      resources.updateConfiguration(config, resources.displayMetrics)\n    }\n  }\n\n`
      );
    }

    if (!contents.includes('resetFontScale()')) {
      contents = contents.replace(
        '  override fun onCreate() {\n    super.onCreate()',
        '  override fun onCreate() {\n    super.onCreate()\n    resetFontScale()'
      );
    }

    if (!contents.includes('resetFontScale(newConfig)')) {
      contents = contents.replace(
        '  override fun onConfigurationChanged(newConfig: Configuration) {\n    super.onConfigurationChanged(newConfig)',
        '  override fun onConfigurationChanged(newConfig: Configuration) {\n    resetFontScale(newConfig)\n    super.onConfigurationChanged(newConfig)'
      );
    }

    config.modResults.contents = contents;
    return config;
  });
}

module.exports = withAndroidFixedFontScale;
