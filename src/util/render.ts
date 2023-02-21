import { NButton, NIcon, NPopover } from "naive-ui";
import { type Component, h } from "vue";
import { RouterLink } from "vue-router";

function renderIcon(icon: Component) {
  return () => h(NIcon, null, { default: () => h(icon) });
}
function renderRoute(label: string, key: string) {
  return h(
    RouterLink,
    {
      to: {
        name: key,
      },
    },
    { default: () => label }
  );
}

export { renderIcon, renderRoute };

export const renderPopover = <T>(
  btnTxtField: string,
  render: (d: T) => ReturnType<typeof h>,
  data?: T
) =>
  data
    ? h(
        NPopover,
        { trigger: "hover" },
        {
          trigger: () =>
            h(
              NButton,
              {},
              {
                default: () => (data as any)[btnTxtField] ?? btnTxtField,
              }
            ),
          default: () => render(data),
        }
      )
    : "-";
