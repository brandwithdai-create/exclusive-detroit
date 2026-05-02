import UIKit
import Capacitor
import WebKit

class MainViewController: CAPBridgeViewController {

    private var loadOverlay: UIView?
    private var loadLabel: UILabel?
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
            // Capacitor's delegate chain. Kept alive after first success so it
            // also catches reloads from WKWebView content-process restarts.
            progressObserver = wv.observe(\.estimatedProgress, options: [.new]) { [weak self] webView, change in
                guard let self = self else { return }
                guard let progress = change.newValue, progress >= 1.0 else { return }
                guard let url = webView.url,
                      !url.absoluteString.isEmpty,
                      url.absoluteString != "about:blank" else { return }
                DispatchQueue.main.async {
                    if self.didSuccessfullyLoad {
                        self.clearStaleOverlay()
                    } else {
                        self.hideLoadOverlay()
                    }
                }
            }
        }

        // External links open via UIApplication.shared.open (system Safari).
        // The app goes to the background; iOS may terminate it. On return, if
        // the WKWebView content-process was killed, it will be at about:blank.
        // Capacitor's handler calls webView.reload() on termination, but this
        // catches the edge case where that hasn't fired yet when we become active.
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
        // Every time this VC becomes visible (after returning from Safari, any
        // modal, or background), clear any stale overlay immediately.
        if didSuccessfullyLoad {
            clearStaleOverlay()
        }
    }

    // MARK: - App Lifecycle

    @objc private func appDidBecomeActive() {
        guard didSuccessfullyLoad else { return }
        guard let wv = webView else { return }
        let url = wv.url?.absoluteString ?? ""
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

        overlay.addSubview(title)
        overlay.addSubview(message)
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
        ])

        loadOverlay = overlay
        loadLabel = message
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
        }
    }

    /// Removes any visible overlay unconditionally — used after first success
    /// to sweep up any overlay that reappeared (content-process restart, etc.).
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
        }
    }

    // MARK: - Failsafe

    private func startFailsafe(delay: Double) {
        failsafeItem?.cancel()
        let item = DispatchWorkItem { [weak self] in
            guard let self = self, !self.didSuccessfullyLoad else { return }

            // If WKWebView is actively loading, extend and keep waiting.
            if self.webView?.isLoading == true {
                self.startFailsafe(delay: 30)
                return
            }

            // If the WKWebView has a real URL, the page loaded but the
            // progress observer may have missed it — hide overlay cleanly.
            if let url = self.webView?.url,
               !url.absoluteString.isEmpty,
               url.absoluteString != "about:blank" {
                self.hideLoadOverlay()
                return
            }

            // Page not loaded and not actively loading — silently reload and
            // keep waiting. The web layer will show its own offline UI if
            // the network is truly unavailable. No native error screen.
            if let serverURL = self.bridge?.config.serverURL {
                self.webView?.load(URLRequest(url: serverURL))
            }
            self.startFailsafe(delay: 60)
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
