import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'

export function SlideOver({ isOpen, onClose, title, children }) {
    return (
        <Transition.Root show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>

                {/* Background Overlay */}
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px]" />
                </Transition.Child>

                {/* Painel Lateral (A "Gaveta") */}
                <div className="fixed inset-0 overflow-hidden">
                    <div className="absolute inset-0 overflow-hidden">
                        <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                            <Transition.Child
                                as={Fragment}
                                enter="transform transition ease-in-out duration-300 sm:duration-500"
                                enterFrom="translate-x-full" // <-- Mágica do slide
                                enterTo="translate-x-0"
                                leave="transform transition ease-in-out duration-300 sm:duration-500"
                                leaveFrom="translate-x-0"
                                leaveTo="translate-x-full" // <-- Mágica do slide
                            >
                                <Dialog.Panel className="pointer-events-auto w-screen max-w-2xl">
                                    {/* Este é o container do seu formulário */}
                                    <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-xl">

                                        {/* Header */}
                                        <div className="bg-blue-600 py-6 px-4 sm:px-6 sticky top-0 z-10">
                                            <Dialog.Title className="text-xl font-semibold text-white">
                                                {title}
                                            </Dialog.Title>
                                        </div>

                                        {/* Conteúdo (Seu formulário) */}
                                        <div className="relative flex-1 p-6 sm:p-8">
                                            {children}
                                        </div>

                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    )
}