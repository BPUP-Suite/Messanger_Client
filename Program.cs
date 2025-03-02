using MessangerAppWebView;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace BPUP_Messanger
{
    static class Program
    {
        [STAThread]
        static void Main()
        {
            // Definisci nomi univoci per il mutex e l'evento
            string mutexName = "MessangerAppWebView_Mutex";
            string eventName = "MessangerAppWebView_Event";
            bool createdNew;

            // Crea o tenta di acquisire il mutex
            using (var mutex = new Mutex(true, mutexName, out createdNew))
            {
                if (createdNew)
                {
                    // Prima istanza
                    using (var eventWaitHandle = new EventWaitHandle(false, EventResetMode.AutoReset, eventName))
                    {
                        // Avvia un thread in background per ascoltare l'evento
                        Thread listenerThread = new Thread(() =>
                        {
                            while (true)
                            {
                                eventWaitHandle.WaitOne();
                                if (Application.OpenForms.Count > 0)
                                {
                                    Application.OpenForms[0].Invoke((MethodInvoker)delegate
                                    {
                                        Form1 form = (Form1)Application.OpenForms[0];
                                        form.ShowWindow();
                                    });
                                }
                            }
                        });
                        listenerThread.IsBackground = true;
                        listenerThread.Start();

                        // Avvia l'applicazione
                        Application.EnableVisualStyles();
                        Application.SetCompatibleTextRenderingDefault(false);
                        Application.Run(new Form1());
                    }
                }
                else
                {
                    // Seconda istanza
                    try
                    {
                        using (var eventWaitHandle = EventWaitHandle.OpenExisting(eventName))
                        {
                            eventWaitHandle.Set(); // Segnala all'istanza esistente
                        }
                    }
                    catch (WaitHandleCannotBeOpenedException)
                    {
                        // L'evento non esiste, probabilmente la prima istanza non è pronta o è chiusa
                        // Per ora, esce silenziosamente
                    }
                    // Termina la seconda istanza
                    return;
                }
            }
        }
    }
}
