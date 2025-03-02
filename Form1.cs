using System;
using System.Drawing;
using System.IO;
using System.Windows.Forms;
using Microsoft.Web.WebView2.WinForms;

namespace MessangerAppWebView
{
    public partial class Form1 : Form
    {
        private WebView2 webView;
        private NotifyIcon trayIcon;

        public Form1()
        {
            InitializeComponent();
            SetupForm();
            SetupTray();
            SetupWebView();
        }

        private void SetupForm()
        {
            this.Text = "Messanger";
            this.Size = new Size(1280, 720);
            this.FormClosing += Form1_FormClosing;
            this.Icon = new Icon("assets/icon.ico");
        }

        private void SetupTray()
        {
            trayIcon = new NotifyIcon
            {
                Icon = new Icon("assets/icon.ico"),
                Text = "Messanger",
                Visible = true
            };

            trayIcon.Click += TrayIcon_Click;   

            ContextMenu trayMenu = new ContextMenu();
            trayMenu.MenuItems.Add("Apri", (s, e) => ShowWindow());
            trayMenu.MenuItems.Add("Chiudi", (s, e) => Application.Exit());
            trayIcon.ContextMenu = trayMenu;
        }

        private void SetupWebView()
        {

            // Definisci il percorso in AppData per il tuo progetto
            string appDataPath = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
                "BPUP",
                "Messenger"
            );

            // Crea la cartella se non esiste
            if (!Directory.Exists(appDataPath))
            {
                Directory.CreateDirectory(appDataPath);
            }

            webView = new WebView2
            {
                Dock = DockStyle.Fill,
                Location = new Point(0, 40)
            };

            // Imposta la directory dei dati in AppData
            webView.CreationProperties = new CoreWebView2CreationProperties
            {
                UserDataFolder = appDataPath
            };

            this.Controls.Add(webView);
            webView.Source = new Uri("https://web.messanger.bpup.israiken.it");
        }

        private void Form1_FormClosing(object sender, FormClosingEventArgs e)
        {
            if (e.CloseReason == CloseReason.UserClosing)
            {
                e.Cancel = true;
                this.Hide();
            }
        }

        private void TrayIcon_Click(object sender, EventArgs e)
        {
            ShowWindow();
        }

        public void ShowWindow()
        {
            this.Show();
            this.WindowState = FormWindowState.Normal;
            this.BringToFront();
            this.Activate();
        }
    }
}