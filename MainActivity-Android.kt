package com.agarchar.app

import android.annotation.SuppressLint
import android.os.Bundle
import android.webkit.*
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.webkit.WebChromeClient
import android.content.Context
import android.net.ConnectivityManager
import android.net.NetworkInfo
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout

class MainActivity : AppCompatActivity() {
    private lateinit var webView: WebView
    private lateinit var swipeRefreshLayout: SwipeRefreshLayout

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        webView = findViewById(R.id.webView)
        swipeRefreshLayout = findViewById(R.id.swipeRefreshLayout)

        // Configurar WebView para PWA con mejor compatibilidad TCL
        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            allowFileAccess = true
            allowContentAccess = true
            setSupportZoom(false)
            builtInZoomControls = false
            displayZoomControls = false
            mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
            cacheMode = WebSettings.LOAD_DEFAULT
            databaseEnabled = true
            setGeolocationEnabled(true)
            
            // Configuraciones adicionales para mejor compatibilidad
            mediaPlaybackRequiresUserGesture = false
            loadsImagesAutomatically = true
            blockNetworkImage = false
            blockNetworkLoads = false
            setRenderPriority(WebSettings.RenderPriority.HIGH)
            
            // Configuraciones para PWA
            allowUniversalAccessFromFileURLs = true
            allowFileAccessFromFileURLs = true
            setAppCacheEnabled(true)
            setAppCachePath(cacheDir.absolutePath)
            
            // Configuraciones específicas para dispositivos TCL
            userAgentString = userAgentString + " AGARCH-AR-PWA/1.0"
            
            // Configuraciones adicionales para TCL
            setSupportMultipleWindows(false)
            javaScriptCanOpenWindowsAutomatically = false
            setLayoutAlgorithm(WebSettings.LayoutAlgorithm.TEXT_AUTOSIZING)
            
            // Configuraciones de red para TCL
            setLoadsImagesAutomatically(true)
            setBlockNetworkImage(false)
            setBlockNetworkLoads(false)
        }

        // Configurar WebViewClient con mejor manejo de errores
        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView?, url: String?): Boolean {
                url?.let { 
                    if (it.startsWith("tel:") || it.startsWith("mailto:") || it.startsWith("sms:")) {
                        return false // Permitir que el sistema maneje estos enlaces
                    }
                    view?.loadUrl(it) 
                }
                return true
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                swipeRefreshLayout.isRefreshing = false
                
                // Verificar si la página se cargó correctamente
                webView.evaluateJavascript("document.title", { title ->
                    if (title == null || title == "null" || title.isEmpty()) {
                        showError("Error de carga", "La página no se cargó correctamente")
                    } else {
                        // Inyectar CSS para mejorar la experiencia en móvil
                        injectMobileOptimizations()
                    }
                })
            }
            
            override fun onReceivedError(view: WebView?, errorCode: Int, description: String?, failingUrl: String?) {
                super.onReceivedError(view, errorCode, description, failingUrl)
                when (errorCode) {
                    ERROR_HOST_LOOKUP -> showError("Error de conexión", "Verifica tu conexión a internet")
                    ERROR_TIMEOUT -> showError("Tiempo de espera agotado", "La conexión tardó demasiado")
                    ERROR_CONNECT -> showError("Error de conexión", "No se pudo conectar al servidor")
                    else -> showError("Error de carga", "No se pudo cargar la página")
                }
            }
        }
        
        // Configurar WebChromeClient para permisos
        webView.webChromeClient = object : WebChromeClient() {
            override fun onPermissionRequest(request: PermissionRequest?) {
                request?.grant(request.resources)
            }
            
            override fun onGeolocationPermissionsShowPrompt(origin: String?, callback: GeolocationPermissions.Callback?) {
                callback?.invoke(origin, true, false)
            }
        }

        // Configurar SwipeRefreshLayout
        swipeRefreshLayout.setOnRefreshListener {
            webView.reload()
        }

        // Cargar la PWA
        loadPWA()
    }
    
    private fun loadPWA() {
        if (isNetworkAvailable()) {
            // Intentar cargar la PWA con timeout
            webView.loadUrl("https://agarch-ar.com")
            
            // Configurar timeout para detectar si la página no carga
            webView.postDelayed({
                if (webView.progress < 100) {
                    showError("Carga lenta", "La aplicación está tardando en cargar. Verifica tu conexión.")
                }
            }, 10000) // 10 segundos timeout
        } else {
            showError("Sin conexión", "Verifica tu conexión a internet e intenta de nuevo")
        }
    }
    
    private fun isNetworkAvailable(): Boolean {
        val connectivityManager = getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        val activeNetworkInfo: NetworkInfo? = connectivityManager.activeNetworkInfo
        return activeNetworkInfo?.isConnected == true
    }
    
    private fun showError(title: String, message: String) {
        Toast.makeText(this, "$title: $message", Toast.LENGTH_LONG).show()
    }
    
    private fun injectMobileOptimizations() {
        val css = """
            <style>
                /* Optimizaciones para móvil */
                body { 
                    -webkit-text-size-adjust: 100%; 
                    -webkit-tap-highlight-color: transparent;
                }
                input, textarea, select { 
                    font-size: 16px !important; 
                    -webkit-appearance: none;
                }
                /* Mejorar scroll en móvil */
                * { 
                    -webkit-overflow-scrolling: touch; 
                }
            </style>
        """.trimIndent()
        
        webView.evaluateJavascript("""
            (function() {
                var style = document.createElement('style');
                style.innerHTML = '$css';
                document.head.appendChild(style);
            })();
        """.trimIndent(), null)
    }

    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }

    override fun onResume() {
        super.onResume()
        webView.onResume()
    }

    override fun onPause() {
        webView.onPause()
        super.onPause()
    }

    override fun onDestroy() {
        webView.destroy()
        super.onDestroy()
    }
}
