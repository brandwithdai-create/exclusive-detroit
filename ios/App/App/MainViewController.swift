import UIKit
import Capacitor
import WebKit

class MainViewController: CAPBridgeViewController {

    private var loadOverlay: UIView?
    private var loadLabel: UILabel?
    private var loadButton: UIButton?
    private var didSuccessfullyLoad = false
    private var failsafeItem: DispatchWorkItem?
    private var progressObserver: NSKeyValueObservation?

    private static let appBg   = UIColor(red: 0.039, green: 0.039, blue: 0.039, alpha: 1.0)
    private static let appGold = UIColor(red: 0.788, green: 0.659, blue: 0.298, alpha: 1.0)

    override func viewDidLoad() {
        view.backgroundColor = MainViewController.appBg
        super.viewDidLoad()

        if let wv = webView {
            wv.isOpaque = false
            wv.backgroundColor = UIColor.clear
            wv.scrollView.backgroundColor = UIColor.clear

            // KVO on estimatedProgress — fires directly from WebKit, bypasses
            // Capacitor's delegate chain entirely.
            //
            // Intentionally NOT invalidated after first success so it also detects
            // reloads triggered by WKWebView content-process restarts. After success,
            // it calls clearStaleOverlay() instead of hideLoadOverlay().
            progressObserver = wv.observe(\.estimatedProgress, options: [.new]) { [weak self] webView, change in
                guard let self = self else { return }
                guard let progress = change.newValue, progress >= 1.0 else { return }
                guard let url = webView.url,
                      !url.absoluteString.isEmpty,
                      url.absoluteString != "about:blank" else { return }
                DispatchQueue.main.async {
                    if self.didSuccessfullyLoad {
                        // Post-success reload (content-process restart, etc.)
                        // Clear any overlay that might have reappeared.
                        self.clearStaleOverlay()
                    } else {
                        self.hideLoadOverlay()
                    }
                }
            }
        }

        // External links open in system Safari (UIApplication.shared.open),
        // not SFSafariViewController — so the app goes to the background.
        // iOS may terminate it under memory pressure. When the user taps the
        // "< Exclusive" back button in Safari, iOS does a cold launch that
        // looks like an app-resume. This observer handles the second scenario:
        // if the app was NOT terminated but the WKWebView content-process was
        // killed while backgrounded, the WKWebView will be at about:blank on
        // resume. Capacitor's delegation handler calls webView.reload() on
        // termination, but if that reload hasn't started yet, we trigger it here.
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(appDidBecomeActive),
            name: UIApplication.didBecomeActiveNotification,
            object: nil
        )

        showLoadOverlay()
        startFailsafe(delay: 60)
    }

    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        // Belt-and-suspenders: every time this VC becomes visible (after returning
        // from Safari, after any modal), ensure no stale overlay is blocking the user.
        if didSuccessfullyLoad {
            clearStaleOverlay()
        }
    }

    // MARK: - App Lifecycle

    @objc private func appDidBecomeActive() {
        guard didSuccessfullyLoad else { return }
        guard let wv = webView else { return }
        let url = wv.url?.absoluteString ?? ""
        // If WKWebView is blank after the app comes to foreground, the content
        // process was likely killed while backgrounded. Reload silently.
        if url.isEmpty || url == "about:blank" {
            if let serverURL = bridge?.config.serverURL {
                wv.load(URLRequest(url: serverURL))
            }
        }
    }

    deinit {
        progressObserver?.invalidate()
    }

    // MARK: - Overlay

    private func showLoadOverlay() {
        // Guard prevents a second overlay from appearing on the same VC instance.
        // The only caller is viewDidLoad(), but this ensures safety.
        guard !didSuccessfullyLoad else { return }

        let overlay = UIView()
        overlay.backgroundColor = MainViewController.appBg
        overlay.translatesAutoresizingMaskIntoConstraints = false

        let title = UILabel()
        title.text = "EXCLUSIVE"
        title.font = UIFont.systemFont(ofSize: 15, weight: .thin)
        title.textColor = MainViewController.appGold
        title.textAlignment = .center
        title.letterSpacing(spacing: 6)
        title.translatesAutoresizingMaskIntoConstraints = false

        let message = UILabel()
        message.text = "Loading..."
        message.font = UIFont.systemFont(ofSize: 11, weight: .light)
        message.textColor = MainViewController.appGold.withAlphaComponent(0.6)
        message.textAlignment = .center
        message.numberOfLines = 0
        message.translatesAutoresizingMaskIntoConstraints = false

        let retryBtn = UIButton(type: .system)
        retryBtn.setTitle("Tap to retry", for: .normal)
        retryBtn.titleLabel?.font = UIFont.systemFont(ofSize: 12, weight: .medium)
        retryBtn.setTitleColor(MainViewController.appGold, for: .normal)
        retryBtn.layer.borderColor = MainViewController.appGold.withAlphaComponent(0.4).cgColor
        retryBtn.layer.borderWidth = 0.5
        retryBtn.layer.cornerRadius = 4
        retryBtn.contentEdgeInsets = UIEdgeInsets(top: 8, left: 16, bottom: 8, right: 16)
        retryBtn.translatesAutoresizingMaskIntoConstraints = false
        retryBtn.alpha = 0
        retryBtn.addTarget(self, action: #selector(retryLoad), for: .touchUpInside)

        overlay.addSubview(title)
        overlay.addSubview(message)
        overlay.addSubview(retryBtn)
        view.addSubview(overlay)

        NSLayoutConstraint.activate([
            overlay.topAnchor.constraint(equalTo: view.topAnchor),
            overlay.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            overlay.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            overlay.bottomAnchor.constraint(equalTo: view.bottomAnchor),
            title.centerXAnchor.constraint(equalTo: overlay.centerXAnchor),
            title.centerYAnchor.constraint(equalTo: overlay.centerYAnchor, constant: -10),
            message.topAnchor.constraint(equalTo: title.bottomAnchor, constant: 12),
            message.leadingAnchor.constraint(equalTo: overlay.leadingAnchor, constant: 32),
            message.trailingAnchor.constraint(equalTo: overlay.trailingAnchor, constant: -32),
            retryBtn.topAnchor.constraint(equalTo: message.bottomAnchor, constant: 24),
            retryBtn.centerXAnchor.constraint(equalTo: overlay.centerXAnchor),
        ])

        loadOverlay = overlay
        loadLabel = message
        loadButton = retryBtn
    }

    private func hideLoadOverlay() {
        failsafeItem?.cancel()
        failsafeItem = nil
        guard !didSuccessfullyLoad, let overlay = loadOverlay else { return }
        didSuccessfullyLoad = true
        UIView.animate(withDuration: 0.25, animations: {
            overlay.alpha = 0
        }) { _ in
            overlay.removeFromSuperview()
            self.loadOverlay = nil
            self.loadLabel = nil
            self.loadButton = nil
        }
    }

    /// Removes any visible overlay without the didSuccessfullyLoad guard.
    /// Called after first success to sweep up any overlay that reappeared due
    /// to state edge cases (content-process restart, app-resume timing, etc.).
    private func clearStaleOverlay() {
        failsafeItem?.cancel()
        failsafeItem = nil
        guard let overlay = loadOverlay else { return }
        UIView.animate(withDuration: 0.15, animations: {
            overlay.alpha = 0
        }) { _ in
            overlay.removeFromSuperview()
            self.loadOverlay = nil
            self.loadLabel = nil
            self.loadButton = nil
        }
    }

    private func showNetworkError() {
        failsafeItem?.cancel()
        failsafeItem = nil
        guard !didSuccessfullyLoad, let label = loadLabel else { return }
        label.text = "Unable to load.\nPlease check your connection."
        label.textColor = MainViewController.appGold
        UIView.animate(withDuration: 0.3) {
            self.loadButton?.alpha = 1
        }
    }

    @objc private func retryLoad() {
        guard let label = loadLabel, let btn = loadButton else { return }
        label.text = "Loading..."
        label.textColor = MainViewController.appGold.withAlphaComponent(0.6)
        UIView.animate(withDuration: 0.2) { btn.alpha = 0 }
        webView?.reload()
        startFailsafe(delay: 60)
    }

    // MARK: - Failsafe

    private func startFailsafe(delay: Double) {
        failsafeItem?.cancel()
        let item = DispatchWorkItem { [weak self] in
            guard let self = self, !self.didSuccessfullyLoad else { return }
            // If the WKWebView is still actively loading, give it 30 more seconds
            // rather than surfacing an error. Slow TestFlight / cellular connections
            // can take well over 20 seconds to receive and render the page.
            if self.webView?.isLoading == true {
                self.startFailsafe(delay: 30)
                return
            }
            if let url = self.webView?.url,
               !url.absoluteString.isEmpty,
               url.absoluteString != "about:blank" {
                // The WKWebView has a real URL — page loaded but progress observer
                // may have missed it. Dismiss the overlay cleanly.
                self.hideLoadOverlay()
            } else {
                // Truly no network or server unreachable. Show error + retry button.
                self.showNetworkError()
            }
        }
        failsafeItem = item
        DispatchQueue.main.asyncAfter(deadline: .now() + delay, execute: item)
    }
}

private extension UILabel {
    func letterSpacing(spacing: CGFloat) {
        guard let text = self.text else { return }
        let attributed = NSMutableAttributedString(string: text)
        attributed.addAttribute(.kern, value: spacing, range: NSRange(location: 0, length: text.count))
        self.attributedText = attributed
    }
}
