// Native React page. Data contract: docs/_head.
import { cssStyle, text } from "@ui/runtime";
export default function Page({ data, state }) {
  return (
    <>
      <div className={"head"}>
        {"\n  "}
        <div>
          <div style={cssStyle("font-weight:800;font-size:1.15rem")}>
            {data.v1}
          </div>
          <div>{data.v2}</div>
          <div>
            {"GSTIN "}
            {data.v3}
            {" · "}
            {data.v4}
          </div>
        </div>
        {"\n  "}
        <div style={cssStyle("text-align:right")}>
          <h1>{data.v5}</h1>
          <div>{data.v6}</div>
          <div>{data.v7}</div>
        </div>
        {"\n"}
      </div>
      {"\n"}
      <table style={cssStyle("margin-top:0")}>
        <tbody>
          <tr>
            <td style={cssStyle("border:0;width:50%")}>
              <div
                style={cssStyle(
                  "font-size:11px;text-transform:uppercase;color:#6b7280",
                )}
              >
                {"Customer"}
              </div>
              <b>{data.v8}</b>
              <br />
              {data.v9}
              <br />
              {data.v10}
            </td>
            <td style={cssStyle("border:0")}>
              <div
                style={cssStyle(
                  "font-size:11px;text-transform:uppercase;color:#6b7280",
                )}
              >
                {"Project"}
              </div>
              <b>{data.v11}</b>
              <br />
              {data.v12}
            </td>
          </tr>
        </tbody>
      </table>
      {"\n"}
    </>
  );
}
